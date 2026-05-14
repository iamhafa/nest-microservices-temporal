import { SystemErrorCode } from '@libs/contract/base/error';
import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { BaseExceptionFilter } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import { AppException, AppExceptionOptions } from '../exception/app-exception';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context: HttpArgumentsHost = host.switchToHttp();
    const response: Response = context.getResponse();

    const { status, body } = this.buildResponse(exception);

    response.status(status).json(body);
  }

  private buildResponse(exception: unknown) {
    // Priority 1: AppException
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        body: {
          success: false,
          error: {
            code: exception.code,
            message: exception.message,
            ...(exception.details ? { details: exception.details } : {}),
          },
        },
      };
    }

    // Priority 2: RPC error từ microservice (có { code, message })
    if (exception instanceof RpcException) {
      const rpcError = exception.getError() as AppExceptionOptions;
      return {
        status: rpcError.status || HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          success: false,
          error: {
            code: rpcError.code || SystemErrorCode.UNCAUGHT_EXCEPTION,
            message: rpcError.message || 'Internal server error',
            ...(rpcError.details ? { details: rpcError.details } : {}),
          },
        },
      };
    }

    // Priority 3: HttpException thông thường
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: {
          success: false,
          error: {
            code: SystemErrorCode.UNCAUGHT_EXCEPTION,
            message: 'Uncaught exception',
          },
        },
      };
    }

    // Fallback: Error không xác định
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: SystemErrorCode.UNCAUGHT_EXCEPTION,
          message: 'Uncaught exception',
        },
      },
    };
  }
}
