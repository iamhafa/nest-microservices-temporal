import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { AppException, AppExceptionOptions } from '../exception/app-exception';

@Catch()
export class RpcExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown): Observable<never> {
    let payload: AppExceptionOptions = {
      code: 'SYS_999',
      message: 'Internal server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    if (exception instanceof AppException) {
      payload = {
        code: exception.code,
        message: exception.message,
        status: exception.getStatus(),
        ...(exception.details ? { details: exception.details } : {}),
      };
    } else if (exception instanceof HttpException) {
      payload = {
        code: 'SYS_999',
        message: exception.message,
        status: exception.getStatus(),
      };
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      if (typeof error === 'object' && error !== null) {
        const obj = error as Record<string, unknown>;
        payload = {
          code: (obj.code as string) || 'SYS_999',
          message: (obj.message as string) || 'Internal server error',
          status: (obj.status as number) || HttpStatus.INTERNAL_SERVER_ERROR,
          ...(obj.details ? { details: obj.details as any } : {}),
        };
      } else if (typeof error === 'string') {
        payload.message = error;
      }
    } else if (exception instanceof Error) {
      payload.message = exception.message;
    }

    return throwError(() => payload);
  }
}
