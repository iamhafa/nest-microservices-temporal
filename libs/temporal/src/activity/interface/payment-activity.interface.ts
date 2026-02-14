export interface IPaymentActivity {
  chargePayment(orderId: number): Promise<string>;
  refundPayment(paymentId: string): Promise<void>;
}
