import { CreateOrderDto, OrderItemDto } from '@libs/contract/order/dto';
import { OrderStatus } from '@libs/contract/order/enum';

export interface IOrderActivity {
  /**
   * Tạo đơn hàng
   */
  createOrder(dto: CreateOrderDto, productPrices: Record<number, number>): Promise<number>;

  /**
   * Xóa đơn hàng
   */
  deleteOrder(orderId: number): Promise<void>;

  /**
   * Lưu ID thanh toán
   */
  savePaymentId(orderId: number, paymentId: string): Promise<void>;

  /**
   * Cập nhật trạng thái đơn hàng
   */
  updateOrderStatus(orderId: number, status: OrderStatus, cancel_reason?: string): Promise<void>;

  /**
   * Lấy tổng tiền đơn hàng
   */
  getOrderTotalAmount(orderId: number): Promise<number>;

  /**
   * Lấy danh sách sản phẩm trong đơn hàng
   */
  getOrderItems(orderId: number): Promise<OrderItemDto[]>;

  /**
   * Lấy ID thanh toán
   */
  getPaymentId(orderId: number): Promise<string | null>;
}
