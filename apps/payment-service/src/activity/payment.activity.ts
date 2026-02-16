import { IPaymentActivity } from '@libs/temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity()
export class PaymentActivities implements IPaymentActivity {
  @ActivityMethod()
  async chargePayment(orderId: number): Promise<string> {
    return `payment_${orderId}_${Date.now()}`;
  }

  @ActivityMethod()
  async refundPayment(paymentId: string): Promise<void> {
    void paymentId;
  }
}
