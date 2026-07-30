import { IDeleteOrderActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'delete-order-activity' })
export class DeleteOrderActivity implements IDeleteOrderActivity {
  private readonly logger = new Logger(DeleteOrderActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'deleteOrder' })
  async execute(orderId: number): Promise<void> {
    this.logger.warn(`Compensating: Deleting order ${orderId}`);
    await this.orderRepository.delete(orderId);
  }
}
