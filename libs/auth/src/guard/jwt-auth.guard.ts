import { AppException } from '@libs/common';
import { SystemErrorCode } from '@libs/contract/base/error';
import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { IAuthRequest, IJwtPayload } from '../interface/jwt.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private clsService: ClsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request: IAuthRequest = context.switchToHttp().getRequest();
    const token: string = this.extractTokenFromHeader(request);

    if (!token) {
      throw new AppException({
        code: SystemErrorCode.UNAUTHORIZED,
        message: 'Authentication token is missing',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    try {
      const secret: string = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload: IJwtPayload = await this.jwtService.verifyAsync(token, { secret });

      // Assign payload to request object so downstream handlers can use it
      request.user = payload;

      // Also attach to cls context for internal correlation across modules (like RabbitMQ headers)
      this.clsService.set('userId', payload.user_id);
    } catch {
      throw new AppException({
        code: SystemErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired authentication token',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : '';
  }
}
