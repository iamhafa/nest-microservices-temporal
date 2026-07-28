import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductBrandResponseDto {
  @ApiProperty({ example: 1, description: 'Brand ID' })
  id: number;

  @ApiProperty({ example: 'Apple', description: 'Brand Name' })
  name: string;

  @ApiProperty({ example: 'apple', description: 'Brand Slug' })
  slug: string;

  @ApiPropertyOptional({ example: 'Apple Inc. Electronics', description: 'Brand Description' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/apple-logo.png', description: 'Brand Logo URL' })
  logo_url?: string;
}
