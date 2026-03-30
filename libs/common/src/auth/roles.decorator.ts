import { UserRole } from '@libs/contract/user';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY: string = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
