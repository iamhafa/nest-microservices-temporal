import { IOrderItem } from '@libs/contract/order';
import { IGetOrderItemsActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderItemEntity } from '../entity/order-item.entity';
import { OrderEntity } from '../entity/order.entity';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'get-order-items-activity' })
export class GetOrderItemsActivity implements IGetOrderItemsActivity {
  private readonly logger = new Logger(GetOrderItemsActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'getOrderItems' })
  async execute(orderId: number): Promise<IOrderItem[]> {
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

    const orderItems: IOrderItem[] = order.items.map((item: OrderItemEntity) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    return orderItems;
  }
}
