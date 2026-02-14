import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @IsNotEmpty()
  product_id: string;

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

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
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
