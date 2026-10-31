import { ICancelOrderDto, IOrderItem, OrderStatus } from '@libs/contract/order';
import {
  type IGetOrderItemsActivity,
  type IGetPaymentIdActivity,
  type IRefundPaymentActivity,
  type IReleaseInventoryActivity,
  type IRestoreInventoryActivity,
  type IUpdateOrderStatusActivity,
  WorkFlowTaskQueue,
} from '@libs/temporal';
import { ActivityInterfaceFor, ApplicationFailure, log, proxyActivities } from '@temporalio/workflow';

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

  log.info(`${cancelOrderWorkflow.name} payload:`, { cancelOrderDto });

  try {
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
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    log.error(`[Order ${order_id}] ${cancelOrderWorkflow.name} failed: ${message}`, {
      orderId: order_id,
      error,
    });

    await orderActivities.updateOrderStatus(
      order_id,
      OrderStatus.CANCEL_FAILED,
      `Cancel failed: ${message} (manual check required)`,
    );

    // Rethrow so the workflow shows as Failed in Temporal instead of Completed
    if (error instanceof ApplicationFailure) {
      log.error(`[Order ${order_id}] Rethrowing ApplicationFailure: ${error.message}`, {
        orderId: order_id,
        type: error.type,
        nonRetryable: error.nonRetryable,
      });

      throw error;
    }

    throw ApplicationFailure.nonRetryable(message);
  }
}
