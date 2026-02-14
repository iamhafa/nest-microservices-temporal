import { OrderItemDto } from '@contract/order/dto/create-order.dto';

export interface IInventoryActivity {
  reserveInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
  releaseInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
}
