import { IRpcErrorPayload, IRpcErrorResponse, SystemErrorCode } from '@libs/contract/base';
import { Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class RmqRpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RmqRpcExceptionFilter.name);

  catch(exception: unknown): IRpcErrorResponse {
    let payload: IRpcErrorPayload = {
      code: SystemErrorCode.UNCAUGHT_EXCEPTION,
      message: 'Internal server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    if (exception instanceof HttpException) {
      payload = {
        code: exception.errorCode ?? SystemErrorCode.UNCAUGHT_EXCEPTION,
        message: exception.message,
        status: exception.getStatus(),
      };
    } else if (exception instanceof Error) {
      payload.message = exception.message;
      this.logger.error(`Unexpected RPC Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unexpected RPC Exception: ${exception}`);
    }

    return {
      success: false,
      error: payload,
    };
  }
}
