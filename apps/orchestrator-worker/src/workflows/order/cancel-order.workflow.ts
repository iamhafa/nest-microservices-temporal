import { CancelOrderDto, OrderItemDto } from '@libs/contract/order/dto';
import { OrderStatus } from '@libs/contract/order/enum';
import {
  IRestoreInventory,
  IGetPaymentId,
  IGetOrderItems,
  IUpdateOrderStatus,
  IRefundPayment,
  IReleaseInventory,
} from '@libs/temporal/activity';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { ActivityInterfaceFor, proxyActivities } from '@temporalio/workflow';

const orderActivities: ActivityInterfaceFor<{
  getPaymentId: IGetPaymentId['execute'];
  getOrderItems: IGetOrderItems['execute'];
  updateOrderStatus: IUpdateOrderStatus['execute'];
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
  refundPayment: IRefundPayment['execute'];
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
  restoreInventory: IRestoreInventory['execute'];
  releaseInventory: IReleaseInventory['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

export async function cancelOrderWorkflow(cancelOrderDto: CancelOrderDto): Promise<void> {
  const { order_id, cancel_reason } = cancelOrderDto;

  const paymentId = await orderActivities.getPaymentId(order_id);
  if (paymentId) {
    await paymentActivities.refundPayment(paymentId);
  }

  const items: OrderItemDto[] = await orderActivities.getOrderItems(order_id);
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
