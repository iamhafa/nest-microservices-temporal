import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { IJwtPayload } from '@libs/auth';
import { AppException } from '@libs/common';
import {
  type IAuthResponseDto,
  type ILoginUserDto,
  type IRegisterUserDto,
  type IUserResponseDto,
  UserErrorCode,
} from '@libs/contract/user';
import { RmqExchange, RmqQueue, UserRoutingKey } from '@libs/messaging';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { UserEntity } from './entity/user.entity';
import { UserRepository } from './repository/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: UserRoutingKey.REGISTER,
    queue: RmqQueue.USER_QUEUE,
  })
  async registerUser(@RabbitPayload() registerUserDto: IRegisterUserDto): Promise<IAuthResponseDto> {
    const { email, password, first_name, last_name } = registerUserDto;

    const existingUser: boolean = await this.userRepository.existsBy({ email });
    if (existingUser) {
      throw new AppException({
        code: UserErrorCode.EMAIL_EXISTS,
        message: 'Email already exists',
        status: HttpStatus.CONFLICT,
      });
    }

    const saltRounds: number = 10;
    const passwordHash: string = await hash(password, saltRounds);

    const user: UserEntity = this.userRepository.create({
      email,
      password_hash: passwordHash,
      first_name,
      last_name,
    });

    const savedUser: UserEntity = await this.userRepository.save(user);

    return this.generateAuthResponse(savedUser);
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: UserRoutingKey.LOGIN,
    queue: RmqQueue.USER_QUEUE,
  })
  async loginUser(@RabbitPayload() loginUserDto: ILoginUserDto): Promise<IAuthResponseDto> {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: {
        email,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        password_hash: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppException({
        code: UserErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const isPasswordValid: boolean = await compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppException({
        code: UserErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    return this.generateAuthResponse(user);
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: UserRoutingKey.GET_BY_ID,
    queue: RmqQueue.USER_QUEUE,
  })
  async getUserById(@RabbitPayload() id: number): Promise<IUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!user) {
      throw new AppException({
        code: UserErrorCode.NOT_FOUND,
        message: 'User not found',
        status: HttpStatus.NOT_FOUND,
      });
    }
    return user;
  }

  private generateAuthResponse(user: UserEntity): IAuthResponseDto {
    const payload: IJwtPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken: string = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }
}
