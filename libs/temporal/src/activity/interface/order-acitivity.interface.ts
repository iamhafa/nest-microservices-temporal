import { ICreateOrderDto, IOrderItem, OrderStatus } from '@libs/contract/order';

// Tạo đơn hàng
export interface ICreateOrderActivity {
  execute(dto: ICreateOrderDto, productPrices: Record<number, number>, userId: number): Promise<number>;
}

// Xóa đơn hàng
export interface IDeleteOrderActivity {
  execute(orderId: number): Promise<void>;
}

// Lưu ID thanh toán vào đơn hàng
export interface ISavePaymentIdActivity {
  execute(orderId: number, paymentId: number): Promise<void>;
}

// Cập nhật trạng thái đơn hàng
export interface IUpdateOrderStatusActivity {
  execute(orderId: number, status: OrderStatus, cancel_reason?: string): Promise<void>;
}

// Lấy tổng số tiền đơn hàng
export interface IGetOrderTotalAmountActivity {
  execute(orderId: number): Promise<number>;
}

// Lấy danh sách sản phẩm trong đơn hàng
export interface IGetOrderItemsActivity {
  execute(orderId: number): Promise<IOrderItem[]>;
}

// Lấy ID thanh toán của đơn hàng
export interface IGetPaymentIdActivity {
  execute(orderId: number): Promise<number>;
}
