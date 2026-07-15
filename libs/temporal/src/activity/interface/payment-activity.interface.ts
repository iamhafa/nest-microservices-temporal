// Thanh toán đơn hàng
export interface IChargePaymentActivity {
  execute(orderId: number, totalAmount: number): Promise<number>;
}

// Hoàn tiền đơn hàng
export interface IRefundPaymentActivity {
  execute(orderId: number, totalAmount?: number): Promise<void>;
}
