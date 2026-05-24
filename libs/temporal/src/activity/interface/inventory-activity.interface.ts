import { OrderItemDto } from '@libs/contract/order/dto';

// Giữ kho tạm thời cho đơn đặt hàng
export interface IReserveInventory {
  execute(orderId: number, orderItems: OrderItemDto[]): Promise<void>;
}

// Nhả kho tạm thời
export interface IReleaseInventory {
  execute(orderId: number, orderItems: OrderItemDto[]): Promise<void>;
}

// Xác nhận kho đã bán (trừ khỏi kho vĩnh viễn)
export interface IConfirmInventory {
  execute(orderId: number, orderItems: OrderItemDto[]): Promise<void>;
}

// Khôi phục kho (trong trường hợp hủy đơn hàng)
export interface IRestoreInventory {
  execute(orderId: number, orderItems: OrderItemDto[]): Promise<void>;
}

// Khởi tạo kho ban đầu cho sản phẩm
export interface IInitializeInventory {
  execute(productId: number, quantity: number): Promise<void>;
}
