import { OrderStatus } from '../enum/order-status.enum';

export interface IOrderItemResponseDto {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface IOrderResponseDto {
  id: number;
  user_id?: number;
  status: OrderStatus;
  address: string;
  email: string;
  payment_id?: number;
  total_amount: number;
  cancel_reason?: string;
  items?: IOrderItemResponseDto[];
}
