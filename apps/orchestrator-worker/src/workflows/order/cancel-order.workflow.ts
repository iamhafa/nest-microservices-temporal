import { IOrderActivity } from '@temporal/activity';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { proxyActivities } from '@temporalio/workflow';

const orderActivities = proxyActivities<IOrderActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.ORDER,
  retry: {
    maximumAttempts: 3,
  },
});

export async function cancelOrderWorkflow(orderId: number): Promise<void> {
  await orderActivities.cancelOrder(orderId);
}
