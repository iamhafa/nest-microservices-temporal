import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { IRpcSuccessResponse } from '@libs/contract/base';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { isBoolean, isObject } from 'class-validator';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RmqRpcResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IRpcSuccessResponse> {
    if (isRabbitContext(context)) {
      return next.handle().pipe(
        map((data: IRpcSuccessResponse) => {
          // Avoid double wrapping if already wrapped
          if (isObject(data) && 'success' in data && isBoolean(data.success)) {
            return data;
          }

          return {
            success: true,
            data: data ?? null,
          };
        }),
      );
    }

    return next.handle();
  }
}
