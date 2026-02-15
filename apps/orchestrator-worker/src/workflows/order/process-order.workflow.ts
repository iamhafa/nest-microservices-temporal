import { CreateOrderRequestDto } from '@contract/order';
import { IInventoryActivity, IPaymentActivity, IShippingActivity } from '@temporal/activity';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { proxyActivities } from '@temporalio/workflow';

export interface OrderResult {
  orderId: number;
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

export async function processOrderWorkflow(input: CreateOrderRequestDto, orderId: number): Promise<OrderResult> {
  console.log('Starting processOrderWorkflow for order:', orderId);
  let paymentId: string | undefined;

  try {
    await inventoryActivities.reserveInventory(orderId, input.items);

    paymentId = await paymentActivities.chargePayment(orderId);

    const shipmentId = await shippingActivities.createShipment(orderId, input.address);

    return {
      orderId,
      status: 'CONFIRMED',
      shipmentId,
      paymentId,
    };
  } catch (error) {
    console.log('Error:', error);
    if (paymentId) {
      await paymentActivities.refundPayment(paymentId);
    }

    await inventoryActivities.releaseInventory(orderId, input.items);

    return {
      orderId,
      status: 'FAILED',
      paymentId,
    };
  }
}
