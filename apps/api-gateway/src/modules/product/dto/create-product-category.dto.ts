import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ICreateProductCategoryDto } from '@libs/contract/product';

export class CreateProductCategoryDto implements ICreateProductCategoryDto {
  @ApiProperty({ example: 'Laptops' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Portable computers and workstations', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
