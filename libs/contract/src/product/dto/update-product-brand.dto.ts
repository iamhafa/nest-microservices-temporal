import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { CreateProductBrandDto } from './create-product-brand.dto';

export class UpdateProductBrandDto extends PartialType(CreateProductBrandDto) {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}
