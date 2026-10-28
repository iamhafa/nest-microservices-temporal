import { SystemErrorCode } from '@libs/contract/base';
import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/internal';
import { BaseExceptionFilter } from '@nestjs/core';
import { isObject, isString } from 'class-validator';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Response {
    const context: HttpArgumentsHost = host.switchToHttp();
    const response: Response = context.getResponse();

    // default error status code is 500 internal server error
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message and details from exception response
      // When response is an object (e.g. from ValidationPipe), extract details array
      const responseObj = isObject(exceptionResponse) ? (exceptionResponse as Record<string, unknown>) : undefined;

      const message: string = isString(exceptionResponse)
        ? exceptionResponse
        : ((responseObj?.message as string) ?? exception.message);

      const details = responseObj?.details as { field: string; message: string }[] | undefined;

      return response.status(status).json({
        success: false,
        error: {
          code:
            (exception as { errorCode?: string }).errorCode ??
            (responseObj?.code as string) ??
            SystemErrorCode.UNCAUGHT_EXCEPTION,
          message,
          details,
        },
      });
    }

    // Log uncaught non-HTTP exceptions for debugging (previously swallowed silently)
    if (exception instanceof Error) {
      this.logger.error(`Uncaught exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${exception}`);
    }

    return response.status(status).json({
      success: false,
      error: {
        code: SystemErrorCode.UNCAUGHT_EXCEPTION,
        message: 'Uncaught exception',
      },
    });
  }
}
