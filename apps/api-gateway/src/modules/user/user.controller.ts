import { type IAuthRequest, Public } from '@libs/auth';
import { RmqPublisherService } from '@libs/messaging';
import { AuthResponseDto, LoginUserDto, RegisterUserDto, UserResponseDto } from './dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth & User')
@Controller()
export class UserController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully', type: AuthResponseDto })
  register(@Body() registerUserDto: RegisterUserDto): Promise<AuthResponseDto> {
    return this.rmqPublisher.request('user.register', registerUserDto);
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT' })
  @ApiOkResponse({ description: 'User logged in successfully', type: AuthResponseDto })
  login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    return this.rmqPublisher.request('user.login', loginUserDto);
  }

  @ApiBearerAuth('Authorization')
  @Get('users/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile', type: UserResponseDto })
  getMe(@Req() { user }: IAuthRequest): Promise<UserResponseDto> {
    return this.rmqPublisher.request('user.get', user.user_id);
  }
}
