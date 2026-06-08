// Thanh toán đơn hàng
export interface IChargePayment {
  execute(orderId: number, totalAmount: number): Promise<number>;
}

// Hoàn tiền đơn hàng
export interface IRefundPayment {
  execute(orderId: number, totalAmount?: number): Promise<void>;
}
