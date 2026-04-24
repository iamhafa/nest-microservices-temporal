import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { isArray, isObject, isString } from 'lodash';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorMessage = isString(exceptionResponse)
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;
    } else if (isObject(exception) && exception !== null) {
      // RPC error object from microservice: { status, message }
      const rpcError = exception as any;
      if (rpcError.status && rpcError.message) {
        const parsedStatus = parseInt(rpcError.status, 10);
        httpStatus = isNaN(parsedStatus) ? HttpStatus.INTERNAL_SERVER_ERROR : parsedStatus;
        errorMessage = rpcError.message;
      }
    }

    this.logger.error(`HTTP Exception: [${httpStatus}] ${JSON.stringify(errorMessage)}`);

    const statusEnumKey = HttpStatus[httpStatus] || 'INTERNAL_SERVER_ERROR';
    const finalErrorMessage = isArray(errorMessage) ? errorMessage.join('; ') : errorMessage;

    response.status(httpStatus).json({
      success: false,
      status_code: httpStatus,
      error: statusEnumKey,
      message: finalErrorMessage,
      path: request.url,
    });
  }
}
