import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductRequestDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Apple iPhone 15 Pro Max 256GB' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25000000 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'https://example.com/iphone.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;
}
