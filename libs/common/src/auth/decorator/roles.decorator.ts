import { UserRole } from '@libs/contract/user/enum';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY: string = 'roles';

export const Roles = (...roles: UserRole[]): MethodDecorator => SetMetadata(ROLES_KEY, roles);
