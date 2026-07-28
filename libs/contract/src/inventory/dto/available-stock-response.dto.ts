import { ApiProperty } from '@nestjs/swagger';

export class AvailableStockResponseDto {
  @ApiProperty({ example: 101, description: 'Product ID' })
  productId: number;

  @ApiProperty({ example: 45, description: 'Available stock quantity (stock - reserved_quantity)' })
  availableQuantity: number;
}
