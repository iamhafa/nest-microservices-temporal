import { CreateOrderDto, OrderItemDto } from '@libs/contract/order/dto';
import { OrderStatus } from '@libs/contract/order/enum';

// Tạo đơn hàng
export interface ICreateOrder {
  execute(dto: CreateOrderDto, productPrices: Record<number, number>): Promise<number>;
}

// Xóa đơn hàng
export interface IDeleteOrder {
  execute(orderId: number): Promise<void>;
}

// Lưu ID thanh toán vào đơn hàng
export interface ISavePaymentId {
  execute(orderId: number, paymentId: number): Promise<void>;
}

// Cập nhật trạng thái đơn hàng
export interface IUpdateOrderStatus {
  execute(orderId: number, status: OrderStatus, cancel_reason?: string): Promise<void>;
}

// Lấy tổng số tiền đơn hàng
export interface IGetOrderTotalAmount {
  execute(orderId: number): Promise<number>;
}

// Lấy danh sách sản phẩm trong đơn hàng
export interface IGetOrderItems {
  execute(orderId: number): Promise<OrderItemDto[]>;
}

// Lấy ID thanh toán của đơn hàng
export interface IGetPaymentId {
  execute(orderId: number): Promise<number>;
}
