import { OrderErrorCode, OrderStatus } from '@libs/contract/order';
import { IUpdateOrderStatusActivity } from '@libs/temporal';
import { Logger, NotFoundException } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { UpdateResult } from 'typeorm';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'update-order-status-activity' })
export class UpdateOrderStatusActivity implements IUpdateOrderStatusActivity {
  private readonly logger = new Logger(UpdateOrderStatusActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'updateOrderStatus' })
  async execute(orderId: number, status: OrderStatus, cancelReason?: string): Promise<void> {
    const result: UpdateResult = await this.orderRepository.update(orderId, {
      status,
      cancel_reason: cancelReason,
    });

    if (result.affected === 0) {
      this.logger.error(`[Order ${orderId}] Failed to update status to ${status}`);

      throw new NotFoundException(`Update order ${orderId} failed`, {
        errorCode: OrderErrorCode.UPDATE_ORDER_FAILED,
      });
    }

    this.logger.log(`[Order ${orderId}] Updated status to ${status}`);
  }
}
