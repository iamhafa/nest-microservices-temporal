import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 1, description: 'Order ID (set by API Gateway from URL param)' })
  @IsInt()
  @Min(1)
  order_id: number;

  @ApiProperty({ example: OrderStatus.SHIPPING, enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
