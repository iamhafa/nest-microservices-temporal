export interface IPaymentActivity {
  /**
   * Thanh toán đơn hàng
   */
  chargePayment(orderId: number, totalAmount: number): Promise<number>;

  /**
   * Hoàn tiền thanh toán
   */
  refundPayment(paymentId: number): Promise<void>;
}
