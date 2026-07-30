import { IGetPaymentIdActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'get-payment-id-activity' })
export class GetPaymentIdActivity implements IGetPaymentIdActivity {
  private readonly logger = new Logger(GetPaymentIdActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'getPaymentId' })
  async execute(orderId: number): Promise<number> {
    const order = await this.orderRepository.findOneOrFail({
      where: {
        id: orderId,
      },
      select: {
        payment_id: true,
      },
    });
    this.logger.log(`[Order ${orderId}] Fetched payment_id: ${order.payment_id}`);

    return order.payment_id;
  }
}
