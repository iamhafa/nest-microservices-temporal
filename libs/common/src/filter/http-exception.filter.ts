import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { type Response } from 'express';
import { isObject, isString } from 'lodash';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = isString(exceptionResponse)
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;
    } else if (isObject(exception) && exception !== null) {
      // RPC error object from microservice: { status, message }
      const rpcError = exception as any;
      if (rpcError.status && rpcError.message) {
        const parsedStatus = parseInt(rpcError.status, 10);
        status = isNaN(parsedStatus) ? HttpStatus.INTERNAL_SERVER_ERROR : parsedStatus;
        message = rpcError.message;
      }
    }

    this.logger.error(`HTTP Exception: [${status}] ${JSON.stringify(message)}`);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
