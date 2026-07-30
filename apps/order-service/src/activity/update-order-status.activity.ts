import { OrderStatus } from '@libs/contract/order';
import { IUpdateOrderStatusActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'update-order-status-activity' })
export class UpdateOrderStatusActivity implements IUpdateOrderStatusActivity {
  private readonly logger = new Logger(UpdateOrderStatusActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'updateOrderStatus' })
  async execute(orderId: number, status: OrderStatus, cancelReason?: string): Promise<void> {
    await this.orderRepository.update(orderId, { status, cancel_reason: cancelReason });
    this.logger.log(`[Order ${orderId}] Updated status to ${status}`);
  }
}
