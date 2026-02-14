import { OrderItemDto } from '@contract/order/dto/create-order.dto';
import { IInventoryActivity } from '@temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity({ name: 'inventory-activities' })
export class InventoryActivities implements IInventoryActivity {
  @ActivityMethod()
  async reserveInventory(orderId: string, items: OrderItemDto[]): Promise<void> {
    console.log('🚀 ~ InventoryActivities ~ reserveInventory ~ orderId:', orderId);
    console.log('🚀 ~ InventoryActivities ~ reserveInventory ~ items:', items);
  }

  @ActivityMethod()
  async releaseInventory(orderId: string, items: OrderItemDto[]): Promise<void> {
    console.log('🚀 ~ InventoryActivities ~ releaseInventory ~ orderId:', orderId);
    console.log('🚀 ~ InventoryActivities ~ releaseInventory ~ items:', items);
  }
}
