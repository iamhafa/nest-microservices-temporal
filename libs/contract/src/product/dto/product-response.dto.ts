import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty({ example: 1, description: 'Image ID' })
  id: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL' })
  url: string;

  @ApiPropertyOptional({ example: 'Product Front View', description: 'Alt text' })
  alt_text?: string;

  @ApiProperty({ example: true, description: 'Is primary image' })
  is_primary: boolean;
}

export class ProductResponseDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  id: number;

  @ApiProperty({ example: 'iPhone 15 Pro', description: 'Product Name' })
  name: string;

  @ApiProperty({ example: 'iphone-15-pro', description: 'Product Slug' })
  slug: string;

  @ApiPropertyOptional({ example: 'Latest Apple Smartphone', description: 'Product Description' })
  description?: string;

  @ApiPropertyOptional({ example: 10, description: 'Category ID' })
  category_id?: number;

  @ApiPropertyOptional({ example: 5, description: 'Brand ID' })
  brand_id?: number;

  @ApiProperty({ example: 999, description: 'Product Price' })
  price: number;

  @ApiProperty({ example: 'usd', description: 'Currency' })
  currency: string;

  @ApiProperty({ example: true, description: 'Is Active' })
  is_active: boolean;

  @ApiPropertyOptional({ type: () => [ProductImageResponseDto], description: 'Product images' })
  images?: ProductImageResponseDto[];

  @ApiPropertyOptional({ example: { color: 'Titanium', storage: '256GB' }, description: 'Dynamic attributes' })
  attributes?: Record<string, string>;
}
