import { AppException } from '@libs/common';
import { OrderErrorCode } from '@libs/contract/order';
import { ISavePaymentIdActivity } from '@libs/temporal';
import { HttpStatus, Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { UpdateResult } from 'typeorm';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'save-payment-id-activity' })
export class SavePaymentIdActivity implements ISavePaymentIdActivity {
  private readonly logger = new Logger(SavePaymentIdActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'savePaymentId' })
  async execute(orderId: number, paymentId: number): Promise<void> {
    const result: UpdateResult = await this.orderRepository.update(orderId, { payment_id: paymentId });

    if (result.affected === 0) {
      this.logger.error(`[Order ${orderId}] Failed to save paymentId`);

      throw new AppException({
        code: OrderErrorCode.UPDATE_ORDER_FAILED,
        status: HttpStatus.NOT_FOUND,
        message: `Update order ${orderId} failed`,
      });
    }

    this.logger.log(`[Order ${orderId}] Saved paymentId: ${paymentId}`);
  }
}
