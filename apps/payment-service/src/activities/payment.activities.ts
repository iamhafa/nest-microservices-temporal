import { IPaymentActivity } from '@temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity()
export class PaymentActivities implements IPaymentActivity {
  @ActivityMethod()
  async chargePayment(orderId: string, amount: number): Promise<string> {
    void amount;
    return `payment_${orderId}_${Date.now()}`;
  }

  @ActivityMethod()
  async refundPayment(paymentId: string): Promise<void> {
    void paymentId;
  }
}
