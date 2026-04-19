import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { isObject, isString } from 'lodash';
import { Observable, throwError } from 'rxjs';

@Catch()
export class RpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    const rpcContext = host.switchToRpc();
    const data = rpcContext.getData();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof RpcException) {
      const error = exception.getError();
      if (isObject(error) && error !== null) {
        status = (error as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
        message = (error as any).message || message;
      } else if (isString(error)) {
        message = error;
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = isString(response) ? response : (response as any).message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`RPC Exception: [${status}] ${message}`, JSON.stringify({ data }));

    return throwError(() => ({ status, message }));
  }
}
