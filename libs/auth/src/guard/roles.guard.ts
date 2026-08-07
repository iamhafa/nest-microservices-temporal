import { AppException } from '@libs/common';
import { SystemErrorCode } from '@libs/contract/base';
import { UserRole } from '@libs/contract/user/enum/user-role.enum';
import { CanActivate, ContextType, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { IAuthRequest } from '../interface/jwt.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // if context type is not http, return true
    if (context.getType<ContextType>() !== 'http') return true;

    const requiredRoles: UserRole[] = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) return true;

    // The user payload is injected by JwtAuthGuard
    const { user }: IAuthRequest = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new AppException({
        code: SystemErrorCode.FORBIDDEN,
        status: HttpStatus.FORBIDDEN,
        message: 'User role not found',
      });
    }

    const hasRole: boolean = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new AppException({
        code: SystemErrorCode.FORBIDDEN,
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to access this resource',
      });
    }

    return true;
  }
}
