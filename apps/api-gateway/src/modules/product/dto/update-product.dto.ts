import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { IUpdateProductDto } from '@libs/contract/product';

export class UpdateProductDto
  extends PartialType(OmitType(CreateProductDto, ['quantity']))
  implements IUpdateProductDto
{
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}
