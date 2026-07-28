import { IInventoryResponseDto } from '@libs/contract/inventory';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryResponseDto implements IInventoryResponseDto {
  @ApiProperty({ example: 1, description: 'Inventory ID' })
  id: number;

  @ApiProperty({ example: 101, description: 'Product ID' })
  product_id: number;

  @ApiProperty({ example: 50, description: 'Total stock' })
  stock: number;

  @ApiProperty({ example: 5, description: 'Reserved stock' })
  reserved_quantity: number;

  @ApiPropertyOptional({ example: 'Warehouse A - Shelf 3', description: 'Warehouse Location' })
  warehouse_location?: string;
}
