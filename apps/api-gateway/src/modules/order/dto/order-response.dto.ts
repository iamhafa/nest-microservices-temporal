import { IOrderItemResponseDto, IOrderResponseDto, OrderStatus } from '@libs/contract/order';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto implements IOrderItemResponseDto {
  @ApiProperty({ example: 1, description: 'Order Item ID' })
  id: number;

  @ApiProperty({ example: 101, description: 'Product ID' })
  product_id: number;

  @ApiProperty({ example: 2, description: 'Quantity purchased' })
  quantity: number;

  @ApiProperty({ example: 150000, description: 'Price per unit' })
  price: number;
}

export class OrderResponseDto implements IOrderResponseDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  id: number;

  @ApiPropertyOptional({ example: 42, description: 'User ID' })
  user_id?: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING, description: 'Order Status' })
  status: OrderStatus;

  @ApiProperty({ example: '123 Main Street', description: 'Shipping Address' })
  address: string;

  @ApiProperty({ example: 'user@example.com', description: 'Customer Email' })
  email: string;

  @ApiPropertyOptional({ example: 1021, description: 'Payment Transaction ID' })
  payment_id?: number;

  @ApiProperty({ example: 300000, description: 'Total Order Amount' })
  total_amount: number;

  @ApiPropertyOptional({ example: 'Customer requested cancellation', description: 'Cancel Reason' })
  cancel_reason?: string;

  @ApiPropertyOptional({ type: () => [OrderItemResponseDto], description: 'Order items' })
  items?: OrderItemResponseDto[];
}
