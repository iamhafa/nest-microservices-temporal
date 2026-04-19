import { Public } from '@libs/common/auth';
import { AuthResponseDto, LoginUserDto, RegisterUserDto, UserResponseDto } from '@libs/contract/user/dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Auth & User')
@Controller()
export class UserController {
  constructor(@Inject('USER_SERVICE_CLIENT') private readonly userServiceClient: ClientProxy) {}

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully', type: AuthResponseDto })
  register(@Body() registerUserDto: RegisterUserDto): Observable<AuthResponseDto> {
    return this.userServiceClient.send({ cmd: 'register-user' }, registerUserDto);
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get JWT' })
  @ApiOkResponse({ description: 'User logged in successfully', type: AuthResponseDto })
  login(@Body() loginUserDto: LoginUserDto): Observable<AuthResponseDto> {
    return this.userServiceClient.send({ cmd: 'login-user' }, loginUserDto);
  }

  @ApiBearerAuth('Authorization')
  @Get('users/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile', type: UserResponseDto })
  getMe(@Req() request: any): Observable<UserResponseDto> {
    const userId = request.user.sub;
    return this.userServiceClient.send({ cmd: 'get-user' }, userId);
  }
}
