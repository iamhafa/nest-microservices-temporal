import { OrderItemDto } from '@libs/contract/order/dto';

export interface IInventoryActivity {
  /**
   * Giữ kho tạm thời cho đơn hàng
   */
  reserveInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void>;

  /**
   * Nhả kho tạm thời (Rollback)
   */
  releaseInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void>;

  /**
   * Xác nhận trừ kho vĩnh viễn
   */
  confirmInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void>;

  /**
   * Khôi phục tồn kho khi hủy đơn hàng
   */
  restoreInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void>;

  /**
   * Khởi tạo tồn kho cho sản phẩm
   */
  initializeInventory(productId: number, quantity: number): Promise<void>;
}
