import { IProductTagResponseDto } from '@libs/contract/product';
import { ApiProperty } from '@nestjs/swagger';

export class ProductTagResponseDto implements IProductTagResponseDto {
  @ApiProperty({ example: 1, description: 'Tag ID' })
  id: number;

  @ApiProperty({ example: 'sale', description: 'Tag Name' })
  name: string;

  @ApiProperty({ example: 'sale-a1b2c3', description: 'Tag Slug' })
  slug: string;
}
