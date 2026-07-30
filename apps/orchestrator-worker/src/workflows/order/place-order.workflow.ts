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
  type ISavePaymentIdActivity,
  type IUpdateOrderStatusActivity,
  type IValidateProductsActivity,
  WorkFlowTaskQueue,
} from '@libs/temporal';
import { ActivityInterfaceFor, ApplicationFailure, proxyActivities } from '@temporalio/workflow';

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
}> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const paymentActivities: ActivityInterfaceFor<{
  chargePayment: IChargePaymentActivity['execute'];
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

export async function placeOrderWorkflow(createOrderDto: ICreateOrderDto, userId?: number) {
  console.log('Payload:', createOrderDto);
  const { items, address } = createOrderDto;
  let orderId: number | undefined;
  let paymentId: number | undefined;
  let totalAmount: number | undefined;

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

    // 4th: Charge payment → PAID
    totalAmount = await orderActivities.getOrderTotalAmount(orderId);
    paymentId = await paymentActivities.chargePayment(orderId, totalAmount);
    await orderActivities.savePaymentId(orderId, paymentId);
    await orderActivities.updateOrderStatus(orderId, OrderStatus.PAID);

    // 5th: Confirm inventory (trừ kho vĩnh viễn)
    await inventoryProxyActivities.confirmInventory(orderId, items);

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
    console.log('Error:', error);

    if (orderId) {
      // 1st: refund nếu đã thanh toán (dùng orderId và totalAmount để bảo vệ chống lặp và xử lý các giao dịch chưa kịp lưu DB)
      await paymentActivities.refundPayment(orderId, totalAmount);

      // 2nd: hoàn lại inventory nếu đã reserve
      await inventoryProxyActivities.releaseInventory(orderId, items);

      // 3rd: Update status to FAILED or DELETE depending on visibility rules
      await orderActivities.updateOrderStatus(
        orderId,
        OrderStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    if (error instanceof ApplicationFailure) {
      throw error;
    }
    const message: string = error instanceof Error ? error.message : 'Workflow execution failed';
    throw ApplicationFailure.nonRetryable(message);
  }
}
