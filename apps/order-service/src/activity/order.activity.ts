import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import { IOrderActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { OrderRepository } from '../repository/order.repository';

@Activity({ name: 'order-activity' })
export class OrderActivity implements IOrderActivity {
  private readonly logger = new Logger(OrderActivity.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  @ActivityMethod()
  async savePaymentId(orderId: number, paymentId: string): Promise<void> {
    await this.orderRepository.update(orderId, { payment_id: paymentId });
    this.logger.log(`[Order ${orderId}] Saved paymentId: ${paymentId}`);
  }

  @ActivityMethod()
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
    await this.orderRepository.update(orderId, { status });
    this.logger.log(`[Order ${orderId}] Updated status to ${status}`);
  }
}
