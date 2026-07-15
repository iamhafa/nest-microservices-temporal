import { OrderStatus } from '../enum/order-status.enum';

export interface IUpdateOrderStatusDto {
  order_id: number;
  status: OrderStatus;
}
