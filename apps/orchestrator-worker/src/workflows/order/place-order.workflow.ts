import { CreateOrderDto, OrderItemDto } from '@libs/contract/order/dto';
import { OrderStatus } from '@libs/contract/order/enum';
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

export async function placeOrderWorkflow(createOrderDto: CreateOrderDto) {
  console.log('Payload:', createOrderDto);
  const { items, address } = createOrderDto;
  let orderId: number | undefined;
  let paymentId: string | undefined;

  try {
    // 0th: Validate products exist & active
    const productIds: number[] = items.map((item: OrderItemDto) => item.product_id);
    const isValid: boolean = await productActivities.validateProducts(productIds);
    if (!isValid) {
      throw new Error('Some products are invalid or inactive');
    }

    // 1st: Fetch product prices from DB
    const productPrices: Record<number, number> = await productActivities.getProductPrices(productIds);

    // 2nd: Create Order with real prices from DB
    orderId = await orderActivities.createOrder(createOrderDto, productPrices);

    // 3rd: Reserve inventory
    await inventoryActivities.reserveInventory(orderId, items);

    // 4th: Charge payment → PAID
    const totalAmount: number = await orderActivities.getOrderTotalAmount(orderId);
    paymentId = await paymentActivities.chargePayment(orderId, totalAmount);
    await orderActivities.savePaymentId(orderId, paymentId);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAID);

    // 5th: Confirm inventory (trừ kho vĩnh viễn)
    await inventoryActivities.confirmInventory(orderId, items);

    // 6th: Create shipment → SHIPPING
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

    // 1st: refund nếu đã thanh toán
    if (paymentId) {
      await paymentActivities.refundPayment(paymentId);
    }

    // 2nd: hoàn lại inventory nếu đã reserve
    if (orderId) {
      await inventoryActivities.releaseInventory(orderId, items);

      // 3rd: Update status to FAILED or DELETE depending on visibility rules
      await orderActivities.updateOrderStatus(orderId, OrderStatus.FAILED, error.message);
    }

    throw error;
  }
}
