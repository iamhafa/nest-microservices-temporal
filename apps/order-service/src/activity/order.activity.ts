import { OrderItemDto } from '@libs/contract/order/dto/create-order-request.dto';
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
  async updateOrderStatus(orderId: number, status: OrderStatus, cancelReason?: string): Promise<void> {
    await this.orderRepository.update(orderId, { status, cancel_reason: cancelReason });
    this.logger.log(`[Order ${orderId}] Updated status to ${status}`);
  }

  @ActivityMethod()
  async getOrderTotalAmount(orderId: number): Promise<number> {
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

  @ActivityMethod()
  async getOrderItems(orderId: number): Promise<OrderItemDto[]> {
    const order = await this.orderRepository.findOneOrFail({
      where: { id: orderId },
      relations: { items: true },
    });
    this.logger.log(`[Order ${orderId}] Fetched ${order.items.length} items`);
    return order.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: Number(item.price),
    }));
  }

  @ActivityMethod()
  async getPaymentId(orderId: number): Promise<string> {
    const order = await this.orderRepository.findOneOrFail({
      where: { id: orderId },
      select: { payment_id: true },
    });
    this.logger.log(`[Order ${orderId}] Fetched payment_id: ${order.payment_id}`);
    return order.payment_id;
  }
}
