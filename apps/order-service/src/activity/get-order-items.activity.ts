import { OrderItemDto } from '@libs/contract/order/dto';
import { IGetOrderItems } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'get-order-items-activity' })
export class GetOrderItemsActivity implements IGetOrderItems {
  private readonly logger = new Logger(GetOrderItemsActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'getOrderItems' })
  async execute(orderId: number): Promise<OrderItemDto[]> {
    const order = await this.orderRepository.findOneOrFail({
      where: { id: orderId },
      relations: { items: true },
    });
    this.logger.log(`[Order ${orderId}] Fetched ${order.items.length} items`);
    return order.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));
  }
}
