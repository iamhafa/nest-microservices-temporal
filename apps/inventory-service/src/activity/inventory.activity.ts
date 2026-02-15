import { OrderItemDto } from '@contract/order/dto/create-order-request.dto';
import { IInventoryActivity } from '@temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity({ name: 'inventory-activity' })
export class InventoryActivity implements IInventoryActivity {
  @ActivityMethod()
  async reserveInventory(orderId: number, items: OrderItemDto[]): Promise<void> {
    console.log('🚀 ~ InventoryActivity ~ reserveInventory ~ orderId:', orderId);
    console.log('🚀 ~ InventoryActivity ~ reserveInventory ~ items:', items);
  }

  @ActivityMethod()
  async releaseInventory(orderId: number, items: OrderItemDto[]): Promise<void> {
    console.log('🚀 ~ InventoryActivity ~ releaseInventory ~ orderId:', orderId);
    console.log('🚀 ~ InventoryActivity ~ releaseInventory ~ items:', items);
  }
}
