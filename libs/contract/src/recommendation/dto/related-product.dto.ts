import { ApiProperty } from '@nestjs/swagger';

export class RelatedProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max', description: 'Name of the recommended product' })
  name: string;

  @ApiProperty({ example: 'Bởi vì cùng chung hệ sinh thái Apple và là dòng điện thoại cao cấp.', description: 'Reason for recommendation' })
  reason: string;
}
