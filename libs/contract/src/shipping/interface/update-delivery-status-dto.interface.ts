import { DeliveryStatus } from '../enum/delivery-status.enum.js';

export interface IUpdateDeliveryStatusDto {
  id: number;
  status: DeliveryStatus;
}
