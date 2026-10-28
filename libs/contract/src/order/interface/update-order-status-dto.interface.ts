import { OrderStatus } from '../enum/order-status.enum.js';

export interface IUpdateOrderStatusDto {
  order_id: number;
  status: OrderStatus;
}
