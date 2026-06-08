import { UserRole } from '@libs/contract/user/enum/user-role.enum';
import { Request } from 'express';

export interface IAuthRequest extends Request {
  user: IJwtPayload;
}

export interface IJwtPayload {
  user_id: number;
  email: string;
  role: UserRole;
}
