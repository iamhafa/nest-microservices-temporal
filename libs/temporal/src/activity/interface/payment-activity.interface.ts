export interface IPaymentActivity {
  chargePayment(orderId: number, totalAmount: number): Promise<string>;
  refundPayment(paymentId: string): Promise<void>;
}
