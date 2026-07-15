import { IAuthResponseDto } from '@libs/contract/user';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto implements IAuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  access_token: string;
}
