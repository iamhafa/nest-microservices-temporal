import { IGetOrderTotalAmountActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'get-order-total-amount-activity' })
export class GetOrderTotalAmountActivity implements IGetOrderTotalAmountActivity {
  private readonly logger = new Logger(GetOrderTotalAmountActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'getOrderTotalAmount' })
  async execute(orderId: number): Promise<number> {
    const order = await this.orderRepository.findOneOrFail({
      where: {
        id: orderId,
      },
      select: {
        total_amount: true,
      },
    });
    this.logger.log(`[Order ${orderId}] Total amount: ${order.total_amount}`);

    return order.total_amount;
  }
}
