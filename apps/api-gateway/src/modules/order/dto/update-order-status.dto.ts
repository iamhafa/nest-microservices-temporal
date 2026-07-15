import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import { IUpdateOrderStatusDto, OrderStatus } from '@libs/contract/order';

export class UpdateOrderStatusDto implements IUpdateOrderStatusDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  @IsInt()
  @Min(1)
  order_id: number;

  @ApiProperty({ example: OrderStatus.SHIPPING, enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
