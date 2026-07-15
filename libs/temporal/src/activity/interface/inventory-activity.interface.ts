import { IOrderItem } from '@libs/contract/order';

// Giữ kho tạm thời cho đơn đặt hàng
export interface IReserveInventoryActivity {
  execute(orderId: number, orderItems: IOrderItem[]): Promise<void>;
}

// Nhả kho tạm thời
export interface IReleaseInventoryActivity {
  execute(orderId: number, orderItems: IOrderItem[]): Promise<void>;
}

// Xác nhận kho đã bán (trừ khỏi kho vĩnh viễn)
export interface IConfirmInventoryActivity {
  execute(orderId: number, orderItems: IOrderItem[]): Promise<void>;
}

// Khôi phục kho (trong trường hợp hủy đơn hàng)
export interface IRestoreInventoryActivity {
  execute(orderId: number, orderItems: IOrderItem[]): Promise<void>;
}

// Khởi tạo kho ban đầu cho sản phẩm
export interface IInitializeInventoryActivity {
  execute(productId: number, quantity: number): Promise<void>;
}
