import { SystemErrorCode } from '@libs/contract/base';
import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/internal';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Response {
    const context: HttpArgumentsHost = host.switchToHttp();
    const response: Response = context.getResponse();

    // default error status code is 500 internal server error
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      return response.status(status).json({
        success: false,
        error: {
          code: exception.errorCode ?? SystemErrorCode.UNCAUGHT_EXCEPTION,
          message: exception.message,
        },
      });
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
