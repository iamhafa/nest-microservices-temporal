import { DeliveryStatus } from '../enum/delivery-status.enum.js';

export interface IShippingResponseDto {
  id: number;
  order_id: number;
  address: string;
  status: DeliveryStatus;
  tracking_code?: string;
}
