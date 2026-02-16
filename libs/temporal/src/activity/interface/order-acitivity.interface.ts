import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';

export interface IOrderActivity {
  savePaymentId(orderId: number, paymentId: string): Promise<void>;
  updateOrderStatus(orderId: number, status: OrderStatus): Promise<void>;
}
