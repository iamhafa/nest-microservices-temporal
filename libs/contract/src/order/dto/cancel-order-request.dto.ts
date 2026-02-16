import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CancelOrderRequestDto {
  @ApiProperty({ example: 1, required: true })
  @IsInt()
  @Min(0)
  order_id: number;

  @ApiProperty({ example: 'Change address', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
