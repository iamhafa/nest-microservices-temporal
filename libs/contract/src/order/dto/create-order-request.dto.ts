import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 100000 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  price: number;
}

export class CreateOrderRequestDto {
  @ApiProperty({
    type: [OrderItemDto],
    example: [
      { product_id: 2, quantity: 2, price: 29990000 },
      { product_id: 4, quantity: 1, price: 5990000 },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: '123 Nguyen Trai, Q1, HCM' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'ser@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
}
