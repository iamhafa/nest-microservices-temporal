import { UserRole } from '@libs/contract/user/enum';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: UserRole[] = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) return true;

    // The user payload is injected by JwtAuthGuard
    const request: Request = context.switchToHttp().getRequest();
    // Use type casting to "any" to tell TS not to check the strict Express.User type
    const user: any = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    const hasRole: boolean = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
