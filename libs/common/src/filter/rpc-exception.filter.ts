import { SystemErrorCode } from '@libs/contract/base/error';
import { Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AppException, AppExceptionOptions } from './exception/app-exception';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown) {
    let payload: AppExceptionOptions = {
      code: SystemErrorCode.UNCAUGHT_EXCEPTION,
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
        code: SystemErrorCode.UNCAUGHT_EXCEPTION,
        message: exception.message,
        status: exception.getStatus(),
      };
    } else if (exception instanceof Error) {
      payload.message = exception.message;
    }

    throw new Error(JSON.stringify(payload));
  }
}
