import { ICancelOrderDto, IOrderItem, OrderStatus } from '@libs/contract/order';
import {
  IGetOrderItemsActivity,
  IGetPaymentIdActivity,
  IRefundPaymentActivity,
  IReleaseInventoryActivity,
  IRestoreInventoryActivity,
  IUpdateOrderStatusActivity,
  WorkFlowTaskQueue,
} from '@libs/temporal';
import { ActivityInterfaceFor, proxyActivities } from '@temporalio/workflow';

const orderActivities: ActivityInterfaceFor<{
  getPaymentId: IGetPaymentIdActivity['execute'];
  getOrderItems: IGetOrderItemsActivity['execute'];
  updateOrderStatus: IUpdateOrderStatusActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.ORDER,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const paymentActivities: ActivityInterfaceFor<{
  refundPayment: IRefundPaymentActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const inventoryProxyActivities: ActivityInterfaceFor<{
  restoreInventory: IRestoreInventoryActivity['execute'];
  releaseInventory: IReleaseInventoryActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

export async function cancelOrderWorkflow(cancelOrderDto: ICancelOrderDto): Promise<void> {
  const { order_id, cancel_reason } = cancelOrderDto;

  const paymentId = await orderActivities.getPaymentId(order_id);
  if (paymentId) {
    await paymentActivities.refundPayment(order_id);
  }

  const items: IOrderItem[] = await orderActivities.getOrderItems(order_id);
  // Nếu đã thanh toán → inventory đã confirm → cộng lại stock
  // Nếu chưa thanh toán → inventory chỉ reserve → nhả reserved
  if (paymentId) {
    await inventoryProxyActivities.restoreInventory(order_id, items);
  } else {
    await inventoryProxyActivities.releaseInventory(order_id, items);
  }
  // Cập nhật trạng thái đơn hàng
  await orderActivities.updateOrderStatus(order_id, OrderStatus.CANCELLED, cancel_reason);
}
