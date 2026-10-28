import { IChargePaymentActivity } from '@libs/temporal';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { PaymentService } from '../payment-service.service.js';

@Activity({ name: 'charge-payment-activity' })
export class ChargePaymentActivity implements IChargePaymentActivity {
  constructor(private readonly paymentService: PaymentService) {}

  @ActivityMethod({ name: 'chargePayment' })
  execute(orderId: number, totalAmount: number): Promise<number> {
    return this.paymentService.chargePayment(orderId, totalAmount);
  }
}
