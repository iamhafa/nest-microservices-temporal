import { CreateOrderDto, OrderItemDto } from '@libs/contract/order/dto/create-order.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';

export interface IOrderActivity {
  createOrder(dto: CreateOrderDto): Promise<number>;
  deleteOrder(orderId: number): Promise<void>;
  savePaymentId(orderId: number, paymentId: string): Promise<void>;
  updateOrderStatus(orderId: number, status: OrderStatus, reason?: string): Promise<void>;
  getOrderTotalAmount(orderId: number): Promise<number>;
  getOrderItems(orderId: number): Promise<OrderItemDto[]>;
  getPaymentId(orderId: number): Promise<string | null>;
}
