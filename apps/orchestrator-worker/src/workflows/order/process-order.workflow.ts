import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import type {
  IInventoryActivity,
  IOrderActivity,
  IPaymentActivity,
  IProductActivity,
  IShippingActivity,
} from '@libs/temporal/activity';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { proxyActivities } from '@temporalio/workflow';

export interface OrderResult {
  orderId: number;
  status: OrderStatus;
  shipmentId?: string;
  paymentId?: string;
}

const productActivities = proxyActivities<IProductActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PRODUCT,
  retry: {
    maximumAttempts: 3,
  },
});

const inventoryActivities = proxyActivities<IInventoryActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
  },
});

const paymentActivities = proxyActivities<IPaymentActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
  },
});

const shippingActivities = proxyActivities<IShippingActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.SHIPPING,
  retry: {
    maximumAttempts: 3,
  },
});

const orderActivities = proxyActivities<IOrderActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.ORDER,
  retry: {
    maximumAttempts: 3,
  },
});

export async function processOrderWorkflow(input: CreateOrderRequestDto, orderId: number): Promise<OrderResult> {
  console.log('Starting processOrderWorkflow for order:', orderId);
  let paymentId: string | undefined;

  try {
    // 0th: Validate products exist & active
    const validation = await productActivities.validateProducts(input.items.map(i => i.product_id));
    if (!validation.valid) {
      await orderActivities.updateOrderStatus(orderId, OrderStatus.FAILED);
      return { orderId, status: OrderStatus.FAILED };
    }

    // 1st: Reserve inventory → CONFIRMED
    await inventoryActivities.reserveInventory(orderId, input.items);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

    // 2nd: Charge payment → PAYMENT_PROCESSING → PAID
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAYMENT_PROCESSING);
    paymentId = await paymentActivities.chargePayment(orderId);
    await orderActivities.savePaymentId(orderId, paymentId);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAID);

    // 3rd: Confirm inventory
    await inventoryActivities.confirmInventory(orderId, input.items);

    // 4th: Create shipment → SHIPPING
    const shipmentId = await shippingActivities.createShipment(orderId, input.address);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.SHIPPING);

    return {
      orderId,
      status: OrderStatus.SHIPPING,
      shipmentId,
      paymentId,
    };
  } catch (error) {
    console.log('Error:', error);

    // Compensation: refund nếu đã thanh toán
    if (paymentId) {
      await paymentActivities.refundPayment(paymentId);
    }

    // Compensation: hoàn lại inventory
    await inventoryActivities.releaseInventory(orderId, input.items);

    // Set status cụ thể dựa trên bước bị lỗi
    const failedStatus = paymentId ? OrderStatus.PAYMENT_FAILED : OrderStatus.FAILED;
    await orderActivities.updateOrderStatus(orderId, failedStatus);

    return {
      orderId,
      status: failedStatus,
      paymentId,
    };
  }
}
