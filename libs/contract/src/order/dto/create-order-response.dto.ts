import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderResponseDto {
  @ApiProperty({ example: 1 })
  order_id: number;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Order created successfully' })
  message: string;
}
