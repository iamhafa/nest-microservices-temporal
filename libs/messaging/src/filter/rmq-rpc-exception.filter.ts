import { IRpcErrorDetails, IRpcErrorPayload, IRpcErrorResponse, SystemErrorCode } from '@libs/contract/base';
import { Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { isObject, isString } from 'class-validator';

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
      const exceptionResponse = exception.getResponse();

      // Extract message and details from exception response
      // When response is an object (e.g. from ValidationPipe), extract details array
      const responseObj = isObject(exceptionResponse) ? (exceptionResponse as Record<string, unknown>) : undefined;

      const message: string = isString(exceptionResponse)
        ? exceptionResponse
        : ((responseObj?.message as string) ?? exception.message);

      const details = responseObj?.details as IRpcErrorDetails[] | undefined;

      payload = {
        code: (exception as { errorCode?: string }).errorCode ?? SystemErrorCode.UNCAUGHT_EXCEPTION,
        message,
        status: exception.getStatus(),
        details,
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
