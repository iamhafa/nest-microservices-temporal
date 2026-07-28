import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '../enum/delivery-status.enum';

export class ShippingResponseDto {
  @ApiProperty({ example: 1, description: 'Shipping ID' })
  id: number;

  @ApiProperty({ example: 4930, description: 'Order ID' })
  order_id: number;

  @ApiProperty({ example: '123 Main Street', description: 'Delivery Address' })
  address: string;

  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.PENDING, description: 'Delivery Status' })
  status: DeliveryStatus;

  @ApiPropertyOptional({ example: 'VN123456789', description: 'Carrier Tracking Code' })
  tracking_code?: string;
}
