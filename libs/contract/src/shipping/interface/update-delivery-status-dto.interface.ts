import { DeliveryStatus } from '../enum/delivery-status.enum';

export interface IUpdateDeliveryStatusDto {
  id: number;
  status: DeliveryStatus;
}
