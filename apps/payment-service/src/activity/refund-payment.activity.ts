import { IRefundPaymentActivity } from '@libs/temporal';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { PaymentService } from '../payment-service.service.js';

@Activity({ name: 'refund-payment' })
export class RefundPaymentActivity implements IRefundPaymentActivity {
  constructor(private readonly paymentService: PaymentService) {}

  @ActivityMethod({ name: 'refundPayment' })
  execute(orderId: number, totalAmount?: number): Promise<void> {
    return this.paymentService.refundPayment(orderId, totalAmount);
  }
}
