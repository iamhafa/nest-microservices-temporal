import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { DeliveryStatus } from '@libs/contract/shipping';
import { IUpdateDeliveryStatusDto } from '@libs/contract/shipping';

export class UpdateDeliveryStatusDto implements IUpdateDeliveryStatusDto {
  @ApiProperty({ example: 1, description: 'Shipping ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: DeliveryStatus.DELIVERED, description: 'Shipping status' })
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status: DeliveryStatus;
}
