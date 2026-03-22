export interface IPaymentActivity {
  /**
   * Thanh toán đơn hàng
   */
  chargePayment(orderId: number, totalAmount: number): Promise<string>;

  /**
   * Hoàn tiền thanh toán
   */
  refundPayment(paymentId: string): Promise<void>;
}
