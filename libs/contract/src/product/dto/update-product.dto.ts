import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}
