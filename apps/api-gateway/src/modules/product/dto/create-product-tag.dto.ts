import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ICreateProductTagDto } from '@libs/contract/product';

export class CreateProductTagDto implements ICreateProductTagDto {
  @ApiProperty({ example: 'sale' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
