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
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const inventoryActivities: ActivityInterfaceFor<IInventoryActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const paymentActivities: ActivityInterfaceFor<IPaymentActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const shippingActivities: ActivityInterfaceFor<IShippingActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.SHIPPING,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const orderActivities: ActivityInterfaceFor<IOrderActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.ORDER,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

export async function placeOrderWorkflow(createOrderRequestDto: CreateOrderRequestDto, orderId: number) {
  console.log('Payload:', createOrderRequestDto);
  const { items, address } = createOrderRequestDto;
  let paymentId: string | undefined;

  try {
    // 0th: Validate products exist & active
    const productIds: number[] = items.map((item: OrderItemDto) => item.product_id);
    const isValid: boolean = await productActivities.validateProducts(productIds);
    if (!isValid) {
      await orderActivities.updateOrderStatus(orderId, OrderStatus.FAILED);
      return { orderId, status: OrderStatus.FAILED };
    }

    // 1st: Reserve inventory (status vẫn là PENDING)
    await inventoryActivities.reserveInventory(orderId, items);

    // 2nd: Charge payment → PAID
    const totalAmount: number = await orderActivities.getOrderTotalAmount(orderId);
    paymentId = await paymentActivities.chargePayment(orderId, totalAmount);
    await orderActivities.savePaymentId(orderId, paymentId);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAID);

    // 3rd: Confirm inventory (trừ kho vĩnh viễn)
    await inventoryActivities.confirmInventory(orderId, items);

    // 4th: Create shipment → SHIPPING
    const shipmentId = await shippingActivities.createShipment(orderId, address);
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
    await inventoryActivities.releaseInventory(orderId, items);

    await orderActivities.updateOrderStatus(orderId, OrderStatus.FAILED);

    return {
      orderId,
      status: OrderStatus.FAILED,
      paymentId,
    };
  }
}
