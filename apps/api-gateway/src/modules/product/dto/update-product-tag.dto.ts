import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { IUpdateProductTagDto } from '@libs/contract/product';
import { CreateProductTagDto } from './create-product-tag.dto';

export class UpdateProductTagDto extends PartialType(CreateProductTagDto) implements IUpdateProductTagDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}
