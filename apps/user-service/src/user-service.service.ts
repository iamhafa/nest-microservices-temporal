import { IJwtPayload } from '@libs/common/auth/interface/jwt.interface';
import { AuthResponseDto, LoginUserDto, RegisterUserDto, UserResponseDto } from '@libs/contract/user/dto';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entity/user.entity';
import { UserRepository } from './repository/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto): Promise<AuthResponseDto> {
    const { email, password, first_name, last_name } = registerUserDto;

    const existingUser: boolean = await this.userRepository.existsBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const saltRounds: number = 10;
    const passwordHash: string = await bcrypt.hash(password, saltRounds);

    const user: UserEntity = this.userRepository.create({
      email,
      password_hash: passwordHash,
      first_name,
      last_name,
    });

    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: {
        email,
        is_active: true,
      },
      select: ['id', 'email', 'password_hash', 'first_name', 'last_name', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid: boolean = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOneBy({
      id,
      is_active: true,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private generateAuthResponse(user: UserEntity): AuthResponseDto {
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
