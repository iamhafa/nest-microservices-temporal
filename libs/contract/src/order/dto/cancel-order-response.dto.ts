import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderResponseDto {
  @ApiProperty({ example: 1 })
  order_id: number;

  @ApiProperty({ example: 'cancelled' })
  status: string;

  @ApiProperty({ example: 'Order cancelled successfully' })
  message: string;

  @ApiProperty({ example: '2026-02-16T11:10:00.000Z' })
  cancelled_at: Date;
}
