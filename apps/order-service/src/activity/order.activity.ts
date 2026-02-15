import { IOrderActivity } from '@temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity({ name: 'order-activity' })
export class OrderActivity implements IOrderActivity {
  @ActivityMethod()
  async cancelOrder(orderId: number): Promise<void> {
    console.log('🚀 ~ OrderActivity ~ cancelOrder ~ orderId:', orderId);
    return Promise.resolve();
  }
}
