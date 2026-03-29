import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
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

  @ApiProperty({ example: 'https://example.com/iphone.jpg' })
  @IsString()
  @IsOptional()
  image_url: string;

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
