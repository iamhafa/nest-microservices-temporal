import { AuthResponseDto, LoginUserDto, RegisterUserDto, UserResponseDto } from '@libs/contract/user';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user-service.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'register-user' })
  registerUser(@Payload() registerUserDto: RegisterUserDto): Promise<AuthResponseDto> {
    return this.userService.registerUser(registerUserDto);
  }

  @MessagePattern({ cmd: 'login-user' })
  loginUser(@Payload() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    return this.userService.loginUser(loginUserDto);
  }

  @MessagePattern({ cmd: 'get-user' })
  getUser(@Payload() id: number): Promise<UserResponseDto> {
    return this.userService.getUserById(id);
  }
}
