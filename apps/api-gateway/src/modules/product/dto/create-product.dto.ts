import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ICreateProductDto } from '@libs/contract/product';

export class CreateProductDto implements ICreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Apple iPhone 15 Pro Max 256GB' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 25000000 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  quantity: number;

  @ApiProperty({
    example: ['https://example.com/iphone-1.jpg', 'https://example.com/iphone-2.jpg'],
    description: 'Danh sách URL ảnh từ S3',
  })
  @IsString({ each: true })
  @IsOptional()
  image_urls: string[];

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsOptional()
  category_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsOptional()
  brand_id: number;

  @ApiProperty({ example: [1, 2] })
  @IsInt({ each: true })
  @IsOptional()
  tag_ids: number[];

  @ApiProperty({ example: { color: 'black', storage: '256GB' } })
  @IsOptional()
  attributes: Record<string, string>;
}
