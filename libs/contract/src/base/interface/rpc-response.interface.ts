import { AppErrorCode } from '../error/app-error-code.type';

export interface IRpcErrorDetails {
  field: string;
  message: string;
}

export interface IRpcErrorPayload {
  code: AppErrorCode | string;
  message: string;
  status?: number;
  details?: IRpcErrorDetails[];
}

export interface IRpcSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface IRpcErrorResponse {
  success: false;
  error: IRpcErrorPayload;
}

export type IRpcResponse<T = any> = IRpcSuccessResponse<T> | IRpcErrorResponse;
