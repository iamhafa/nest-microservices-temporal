import { ISavePaymentId } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'save-payment-id-activity' })
export class SavePaymentIdActivity implements ISavePaymentId {
  private readonly logger = new Logger(SavePaymentIdActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'savePaymentId' })
  async execute(orderId: number, paymentId: number): Promise<void> {
    await this.orderRepository.update(orderId, { payment_id: paymentId });
    this.logger.log(`[Order ${orderId}] Saved paymentId: ${paymentId}`);
  }
}
