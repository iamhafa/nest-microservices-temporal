import { CreateOrderDto } from '@contract/order/dto/create-order.dto';
import { IInventoryActivity, IPaymentActivity, IShippingActivity } from '@temporal/activity';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { proxyActivities } from '@temporalio/workflow';

export interface OrderResult {
  orderId: string;
  status: 'CONFIRMED' | 'FAILED';
  shipmentId?: string;
  paymentId?: string;
}

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

export async function processOrderWorkflow(input: CreateOrderDto): Promise<OrderResult> {
  console.log('Starting processOrderWorkflow for order:', input.orderId);
  let paymentId: string | undefined;

  try {
    await inventoryActivities.reserveInventory(input.orderId, input.items);

    paymentId = await paymentActivities.chargePayment(input.orderId, input.amount);

    const shipmentId = await shippingActivities.createShipment(input.orderId, input.address);

    return {
      orderId: input.orderId,
      status: 'CONFIRMED',
      shipmentId,
      paymentId,
    };
  } catch (error) {
    console.log('Error:', error);
    if (paymentId) {
      await paymentActivities.refundPayment(paymentId);
    }

    await inventoryActivities.releaseInventory(input.orderId, input.items);

    return {
      orderId: input.orderId,
      status: 'FAILED',
      paymentId,
    };
  }
}
