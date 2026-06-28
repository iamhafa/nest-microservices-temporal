import { CreateOrderDto, OrderItemDto } from '@libs/contract/order/dto/create-order.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import { ICreateOrder } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderItemEntity } from '../entity/order-item.entity';
import { OrderEntity } from '../entity/order.entity';
import { OrderItemRepository } from '../repository/order-item.repository';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'create-order-activity' })
export class CreateOrderActivity implements ICreateOrder {
  private readonly logger = new Logger(CreateOrderActivity.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  @ActivityMethod({ name: 'createOrder' })
  async execute(createOrderDto: CreateOrderDto, productPrices: Record<number, number>, userId?: number): Promise<number> {
    const { items, address, email } = createOrderDto;

    // calculate total amount of order
    const totalAmount: number = items.reduce(
      (sum: number, item: OrderItemDto) => sum + productPrices[item.product_id] * item.quantity,
      0,
    );
    const orderItems: OrderItemEntity[] = this.orderItemRepository.create(
      items.map((item: OrderItemDto) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: productPrices[item.product_id],
      })),
    );

    const order: OrderEntity = this.orderRepository.create({
      status: OrderStatus.PENDING,
      address,
      email,
      user_id: userId,
      total_amount: totalAmount,
      items: orderItems,
    });

    const savedOrder: OrderEntity = await this.orderRepository.save(order);
    this.logger.log(`Created order: ${savedOrder.id}`);

    return savedOrder.id;
  }
}
