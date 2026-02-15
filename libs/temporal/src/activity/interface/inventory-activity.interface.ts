import { OrderItemDto } from '@contract/order/dto/create-order-request.dto';

export interface IInventoryActivity {
  reserveInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
  releaseInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
}
