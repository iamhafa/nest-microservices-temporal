import { OrderItemDto } from '@contract/order/dto/create-order.dto';

export interface IInventoryActivity {
  reserveInventory(orderId: string, items: OrderItemDto[]): Promise<void>;
  releaseInventory(orderId: string, items: OrderItemDto[]): Promise<void>;
}
