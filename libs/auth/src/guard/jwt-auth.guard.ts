import { AppException } from '@libs/common';
import { SystemErrorCode } from '@libs/contract/base';
import { ContextType, ExecutionContext, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, TokenExpiredError, WrongSecretProviderError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { IJwtPayload } from '../interface/jwt.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private clsService: ClsService,
  ) {
    super();
  }

  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Only execute HTTP JWT guard for HTTP REST requests (skip for RPC / AMQP / Workers)
    if (context.getType<ContextType>() !== 'http') return true;

    // Check if the route is marked @Public() or is a public infrastructure endpoint (/metrics)
    const request: Request = context.switchToHttp().getRequest();
    if (request.url.includes('/metrics')) return true;

    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    return super.canActivate(context);
  }

  /**
   * Phương thức handleRequest được Passport tự động gọi sau khi hoàn tất quá trình xác thực JWT Strategy.
   * Hàm này được ghi đè (override) để chuyển đổi các lỗi xác thực của Passport/jsonwebtoken thành AppException chuẩn hóa của hệ thống.
   *
   * @param err Lỗi hệ thống / crash mã nguồn nếu có xảy ra trong quá trình chạy Strategy (null nếu không có lỗi).
   * @param user Đối tượng payload người dùng nếu xác thực thành công, hoặc boolean `false` nếu xác thực thất bại.
   * @param info Thông tin chi tiết nguyên nhân thất bại do Passport/jsonwebtoken cung cấp (ví dụ: JsonWebTokenError, TokenExpiredError).
   * @returns TUser Payload người dùng được trả về và tự động gán vào đối tượng `request.user`.
   * @throws AppException Ngoại lệ chuẩn hóa với mã SYS_001 (UNAUTHORIZED) khi xác thực thất bại.
   */
  override handleRequest<TUser = IJwtPayload>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      let message = 'Authentication token is missing';

      if (info instanceof Error) {
        if (info instanceof JsonWebTokenError) {
          if (info instanceof TokenExpiredError) {
            message = 'Authentication token has expired';
          } else if (info instanceof WrongSecretProviderError) {
            message = 'Invalid authentication token secret key';
          } else {
            message = 'Authentication token is invalid';
          }
        } else {
          message = info.message;
        }
      }

      this.logger.error(`JWT Authentication Failed: ${message}`, err || info);

      throw new AppException({
        code: SystemErrorCode.UNAUTHORIZED,
        status: HttpStatus.UNAUTHORIZED,
        message,
      });
    }

    // Extract user ID from JWT payload
    const userId: number = user.user_id as IJwtPayload['user_id'];

    // Attach userId to CLS context for correlation ID & context propagation
    this.clsService.set('userId', userId);

    return user;
  }
}
