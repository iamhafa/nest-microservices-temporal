import { ApiProperty } from '@nestjs/swagger';

export class CreateProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  name: string;

  @ApiProperty({ example: 25000000 })
  price: number;

  @ApiProperty({ example: 'https://example.com/iphone.jpg' })
  image_url: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  updated_at: Date;

  @ApiProperty({ example: null })
  deleted_at: Date;
}
