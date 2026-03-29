import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class GetRelatedProductsDto {
  @ApiProperty({ example: 1, description: 'ID of the product to find recommendations for' })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  product_id: number;
}
