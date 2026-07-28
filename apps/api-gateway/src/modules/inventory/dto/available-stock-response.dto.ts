import { IAvailableStockResponseDto } from '@libs/contract/inventory';
import { ApiProperty } from '@nestjs/swagger';

export class AvailableStockResponseDto implements IAvailableStockResponseDto {
  @ApiProperty({ example: 101, description: 'Product ID' })
  productId: number;

  @ApiProperty({ example: 45, description: 'Available stock quantity (stock - reserved_quantity)' })
  availableQuantity: number;
}
