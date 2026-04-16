import { ApiProperty } from '@nestjs/swagger';

export class RelatedProductDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  id: number;

  @ApiProperty({ example: 'iPhone 15 Pro Max', description: 'Product name' })
  name: string;

  @ApiProperty({ example: 'Latest iPhone model', description: 'Product description' })
  description: string;

  @ApiProperty({ example: 30000000, description: 'Product price' })
  price: number;

  @ApiProperty({ example: 'https://example.com/iphone.jpg', description: 'Product image URL' })
  image_url: string;

  @ApiProperty({ example: 'Smartphone', description: 'Product category' })
  category_name: string;

  @ApiProperty({ example: 'Apple', description: 'Product brand' })
  brand_name: string;

  @ApiProperty({ example: 0.95, description: 'Cosine similarity score (0.0 -> 1.0)' })
  similarity_score: number;
}
