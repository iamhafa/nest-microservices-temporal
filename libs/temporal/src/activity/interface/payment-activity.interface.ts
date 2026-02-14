export interface IPaymentActivity {
  chargePayment(orderId: string, amount: number): Promise<string>;
  refundPayment(paymentId: string): Promise<void>;
}
