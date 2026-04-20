import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { isObject, isString } from 'lodash';
import { Observable, throwError } from 'rxjs';

/**
 * RpcExceptionFilter: Chạy ở cấp Microservices.
 * 
 * Flow:
 * 1. Bắt tất cả các lỗi được throw ra từ bên trong 1 Microservice.
 * 2. Trích xuất thông tin status code và nội dung message lỗi.
 * 3. Bọc chúng lại thành một object thuần { status, message }.
 * 4. Ném (throw) object này thông qua RabbitMQ ngược về lại cho người gọi (thường là API Gateway).
 * 
 * Lưu ý: Chúng ta KHÔNG format JSON ({ success, status_code... }) ở đây. Việc định dạng 
 * response cuối cùng để gửi cho Client sẽ do HttpExceptionFilter ở API Gateway đảm nhận.
 */
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

    // Gửi payload tối giản { status, message } qua RabbitMQ về lại API Gateway
    return throwError(() => ({ status, message }));
  }
}
