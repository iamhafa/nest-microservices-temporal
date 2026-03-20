import { CancelOrderRequestDto } from '@libs/contract/order/dto/cancel-order-request.dto';
import { OrderItemDto } from '@libs/contract/order/dto/create-order.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import { IInventoryActivity, IOrderActivity, IPaymentActivity } from '@libs/temporal/activity';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { ActivityInterfaceFor, proxyActivities } from '@temporalio/workflow';

const orderActivities: ActivityInterfaceFor<IOrderActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.ORDER,
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

const inventoryActivities: ActivityInterfaceFor<IInventoryActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

export async function cancelOrderWorkflow(cancelDto: CancelOrderRequestDto, orderId: number): Promise<void> {
  const paymentId = await orderActivities.getPaymentId(orderId);
  if (paymentId) {
    await paymentActivities.refundPayment(paymentId);
  }

  const items: OrderItemDto[] = await orderActivities.getOrderItems(orderId);
  // Hoàn lại số lượng sản phẩm
  await inventoryActivities.releaseInventory(orderId, items);
  // Cập nhật trạng thái đơn hàng
  await orderActivities.updateOrderStatus(orderId, OrderStatus.CANCELLED, cancelDto.reason);
}
