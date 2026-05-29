import { OrderItemDto } from '@libs/contract/order/dto';
import { IGetOrderItems } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';
import { OrderEntity } from '../entity/order.entity';
import { OrderItemEntity } from '../entity/order-item.entity';

@Activity({ name: 'get-order-items-activity' })
export class GetOrderItemsActivity implements IGetOrderItems {
  private readonly logger = new Logger(GetOrderItemsActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'getOrderItems' })
  async execute(orderId: number): Promise<OrderItemDto[]> {
    const order: OrderEntity = await this.orderRepository.findOneOrFail({
      where: {
        id: orderId,
      },
      relations: {
        items: true,
      },
      select: {
        items: {
          product_id: true,
          quantity: true,
        },
      },
    });
    this.logger.log(`[Order ${orderId}] Fetched ${order.items.length} items`);

    const orderItems: OrderItemDto[] = order.items.map((item: OrderItemEntity) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    return orderItems;
  }
}
