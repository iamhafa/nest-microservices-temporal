import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ example: 1, required: true, description: 'Product ID' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 50, required: true, description: 'Quantity change (can be positive or negative)' })
  @IsInt()
  @IsNotEmpty()
  quantity_change: number;

  @ApiProperty({ example: 'Stock refill', required: false, description: 'Reason for adjustment' })
  @IsString()
  @IsOptional()
  reason?: string;
}
