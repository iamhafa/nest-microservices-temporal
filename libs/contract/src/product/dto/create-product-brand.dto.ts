import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductBrandDto {
  @ApiProperty({ example: 'Apple' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'apple' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Apple Inc.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logo_url?: string;
}
