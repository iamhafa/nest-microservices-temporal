import { AppException } from '@libs/common';
import { OrderErrorCode } from '@libs/contract/order';
import { IDeleteOrderActivity } from '@libs/temporal';
import { HttpStatus, Logger } from '@nestjs/common';
import { isNumber } from 'lodash';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { DeleteResult } from 'typeorm';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'delete-order-activity' })
export class DeleteOrderActivity implements IDeleteOrderActivity {
  private readonly logger = new Logger(DeleteOrderActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod({ name: 'deleteOrder' })
  async execute(orderId: number): Promise<void> {
    this.logger.warn(`Compensating: Deleting order ${orderId}`);
    const result: DeleteResult = await this.orderRepository.delete(orderId);

    if (!isNumber(result.affected) || result.affected <= 0) {
      this.logger.error(`Compensating: Delete order ${orderId} failed`);

      throw new AppException({
        code: OrderErrorCode.DELETE_ORDER_FAILED,
        status: HttpStatus.NOT_FOUND,
        message: `Delete order ${orderId} failed`,
      });
    }

    this.logger.warn(`Compensating: Delete order ${orderId} successfully`);
  }
}
