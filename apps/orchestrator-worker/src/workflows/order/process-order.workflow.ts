import { CreateOrderRequestDto, OrderItemDto } from '@libs/contract/order/dto/create-order-request.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import type {
  IInventoryActivity,
  IOrderActivity,
  IPaymentActivity,
  IProductActivity,
  IShippingActivity,
} from '@libs/temporal/activity';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { ActivityInterfaceFor, proxyActivities } from '@temporalio/workflow';

const productActivities: ActivityInterfaceFor<IProductActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PRODUCT,
  retry: {
    maximumAttempts: 3,
  },
});

const inventoryActivities: ActivityInterfaceFor<IInventoryActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
  },
});

const paymentActivities: ActivityInterfaceFor<IPaymentActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
  },
});

const shippingActivities: ActivityInterfaceFor<IShippingActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.SHIPPING,
  retry: {
    maximumAttempts: 3,
  },
});

const orderActivities: ActivityInterfaceFor<IOrderActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.ORDER,
  retry: {
    maximumAttempts: 3,
  },
});

export async function processOrderWorkflow(input: CreateOrderRequestDto, orderId: number) {
  console.log('Starting processOrderWorkflow for order:', orderId);
  let paymentId: string | undefined;

  try {
    // 0th: Validate products exist & active
    const productIds: number[] = input.items.map((item: OrderItemDto) => item.product_id);
    const isValid: boolean = await productActivities.validateProducts(productIds);
    if (!isValid) {
      await orderActivities.updateOrderStatus(orderId, OrderStatus.FAILED);
      return { orderId, status: OrderStatus.FAILED };
    }

    // 1st: Reserve inventory (status vẫn là PENDING)
    await inventoryActivities.reserveInventory(orderId, input.items);

    // 2nd: Charge payment → PAID
    paymentId = await paymentActivities.chargePayment(orderId);
    await orderActivities.savePaymentId(orderId, paymentId);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAID);

    // 3rd: Confirm inventory (trừ kho vĩnh viễn)
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
    console.log('Error in processOrderWorkflow:', error);

    // Compensation: refund nếu đã thanh toán
    if (paymentId) {
      await paymentActivities.refundPayment(paymentId);
    }

    // Compensation: hoàn lại inventory
    await inventoryActivities.releaseInventory(orderId, input.items);

    await orderActivities.updateOrderStatus(orderId, OrderStatus.FAILED);

    return {
      orderId,
      status: OrderStatus.FAILED,
      paymentId,
    };
  }
}
