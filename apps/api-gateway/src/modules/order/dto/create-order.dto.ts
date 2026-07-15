import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ICreateOrderDto, IOrderItem } from '@libs/contract/order';

export class OrderItemDto implements IOrderItem {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto implements ICreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    example: [
      { product_id: 2, quantity: 1 },
      { product_id: 4, quantity: 1 },
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

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
