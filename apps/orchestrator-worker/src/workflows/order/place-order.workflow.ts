import { ICreateOrderDto, IOrderItem, OrderStatus } from '@libs/contract/order';
import {
  type IChargePaymentActivity,
  type IConfirmInventoryActivity,
  type ICreateOrderActivity,
  type ICreateShipmentActivity,
  type IGetOrderTotalAmountActivity,
  type IGetProductPricesActivity,
  type IRefundPaymentActivity,
  type IReleaseInventoryActivity,
  type IReserveInventoryActivity,
  type IRestoreInventoryActivity,
  type ISavePaymentIdActivity,
  type IUpdateOrderStatusActivity,
  type IValidateProductsActivity,
  WorkFlowTaskQueue,
} from '@libs/temporal';
import { ActivityInterfaceFor, ApplicationFailure, log, proxyActivities } from '@temporalio/workflow';

const productActivities: ActivityInterfaceFor<{
  validateProducts: IValidateProductsActivity['execute'];
  getProductPrices: IGetProductPricesActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PRODUCT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const inventoryProxyActivities: ActivityInterfaceFor<{
  reserveInventory: IReserveInventoryActivity['execute'];
  releaseInventory: IReleaseInventoryActivity['execute'];
  confirmInventory: IConfirmInventoryActivity['execute'];
  restoreInventory: IRestoreInventoryActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

// Charge: limited retries, then the saga gives up and compensates.
// Card declined is non-retryable; an open circuit breaker delays the next retry via nextRetryDelay.
const paymentChargeActivities: ActivityInterfaceFor<{
  chargePayment: IChargePaymentActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

// Refund (compensation): must eventually succeed, so retry without an attempt limit for up to 24 hours.
const paymentRefundActivities: ActivityInterfaceFor<{
  refundPayment: IRefundPaymentActivity['execute'];
}> = proxyActivities({
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  startToCloseTimeout: '30 seconds',
  scheduleToCloseTimeout: '24 hours',
  retry: {
    initialInterval: '5 seconds',
    backoffCoefficient: 2,
    maximumInterval: '2 minutes',
  },
});

const shippingActivities: ActivityInterfaceFor<{
  createShipment: ICreateShipmentActivity['execute'];
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.SHIPPING,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const orderActivities: ActivityInterfaceFor<{
  createOrder: ICreateOrderActivity['execute'];
  getOrderTotalAmount: IGetOrderTotalAmountActivity['execute'];
  savePaymentId: ISavePaymentIdActivity['execute'];
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

export async function placeOrderWorkflow(createOrderDto: ICreateOrderDto, userId: number) {
  log.info(`${placeOrderWorkflow.name} payload:`, { createOrderDto });

  const { items, address } = createOrderDto;
  let orderId: number | undefined;
  let paymentId: number | undefined;
  let totalAmount: number | undefined;

  // Progress flags: compensation only undoes the steps that actually ran.
  let inventoryReserved: boolean = false;
  let chargeAttempted: boolean = false;
  let inventoryConfirmed: boolean = false;

  try {
    // 0th: Validate products exist & active
    const productIds: number[] = items.map((item: IOrderItem) => item.product_id);
    const isValid: boolean = await productActivities.validateProducts(productIds);
    if (!isValid) {
      throw ApplicationFailure.nonRetryable('Some products are invalid or inactive');
    }

    // 1st: Fetch product prices from DB
    const productPrices: Record<number, number> = await productActivities.getProductPrices(productIds);

    // 2nd: Create Order with real prices from DB
    orderId = await orderActivities.createOrder(createOrderDto, productPrices, userId);

    // 3rd: Reserve inventory
    await inventoryProxyActivities.reserveInventory(orderId, items);
    inventoryReserved = true;

    // 4th: Charge payment → PAID
    totalAmount = await orderActivities.getOrderTotalAmount(orderId);
    // Set before calling: Stripe may have charged even if the activity reports a failure.
    chargeAttempted = true;

    paymentId = await paymentChargeActivities.chargePayment(orderId, totalAmount);
    await orderActivities.savePaymentId(orderId, paymentId);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAID);

    // 5th: Confirm inventory (trừ kho vĩnh viễn)
    await inventoryProxyActivities.confirmInventory(orderId, items);
    inventoryConfirmed = true;

    // 6th: Create shipment → SHIPPING
    const shipmentId: number = await shippingActivities.createShipment(orderId, address);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.SHIPPING);

    return {
      orderId,
      status: OrderStatus.SHIPPING,
      shipmentId,
      paymentId,
    };
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';

    log.error(`[Order ${orderId}] ${placeOrderWorkflow.name} failed: ${message}`, {
      orderId,
      error,
      inventoryReserved,
      chargeAttempted,
      inventoryConfirmed,
    });

    if (orderId) {
      // 1st: refund nếu đã gọi charge (Stripe có thể đã trừ tiền dù activity báo lỗi)
      if (chargeAttempted) {
        await paymentRefundActivities.refundPayment(orderId, totalAmount);
      }

      // 2nd: trả lại kho: đã confirm → cộng lại stock, mới reserve → nhả reserved
      if (inventoryConfirmed) {
        await inventoryProxyActivities.restoreInventory(orderId, items);
      } else if (inventoryReserved) {
        await inventoryProxyActivities.releaseInventory(orderId, items);
      }

      // 3rd: Update status to PLACE_FAILED
      await orderActivities.updateOrderStatus(orderId, OrderStatus.PLACE_FAILED, message);
    }

    if (error instanceof ApplicationFailure) {
      log.error(`[Order ${orderId}] Rethrowing ApplicationFailure: ${error.message}`, {
        orderId,
        type: error.type,
        nonRetryable: error.nonRetryable,
      });

      throw error;
    }

    throw ApplicationFailure.nonRetryable(message);
  }
}
