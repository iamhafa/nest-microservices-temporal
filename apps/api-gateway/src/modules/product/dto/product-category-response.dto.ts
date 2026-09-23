import { IProductCategoryResponseDto } from '@libs/contract/product';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryResponseDto implements IProductCategoryResponseDto {
  @ApiProperty({ example: 1, description: 'Category ID' })
  id: number;

  @ApiProperty({ example: 'Laptops', description: 'Category Name' })
  name: string;

  @ApiProperty({ example: 'laptops-a1b2c3', description: 'Category Slug' })
  slug: string;

  @ApiPropertyOptional({ example: 'Portable computers and workstations', description: 'Category Description' })
  description?: string;
}
