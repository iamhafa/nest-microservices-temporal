import { OrderItemDto } from '@libs/contract/order/dto/create-order-request.dto';

export interface IInventoryActivity {
  reserveInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
  releaseInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
  confirmInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
  restoreInventory(orderId: number, items: OrderItemDto[]): Promise<void>;
}
