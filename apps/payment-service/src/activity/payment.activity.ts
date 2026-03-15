import { IPaymentActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity()
export class PaymentActivities implements IPaymentActivity {
  private readonly logger = new Logger(PaymentActivities.name);

  @ActivityMethod()
  async chargePayment(orderId: number, totalAmount: number): Promise<string> {
    this.logger.log(`[Order ${orderId}] Charging payment: ${totalAmount}`);
    return `payment_${orderId}_${Date.now()}`;
  }

  @ActivityMethod()
  async refundPayment(paymentId: string): Promise<void> {
    this.logger.warn(`Refunding payment: ${paymentId}`);
    void paymentId;
  }
}
