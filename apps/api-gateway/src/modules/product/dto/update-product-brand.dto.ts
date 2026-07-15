import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { CreateProductBrandDto } from './create-product-brand.dto';
import { IUpdateProductBrandDto } from '@libs/contract/product';

export class UpdateProductBrandDto extends PartialType(CreateProductBrandDto) implements IUpdateProductBrandDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}
