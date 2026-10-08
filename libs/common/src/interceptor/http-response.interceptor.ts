import { CallHandler, ContextType, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps successful HTTP responses into a standardized envelope: `{ success: true, data }`.
 *
 * This interceptor is the HTTP-layer counterpart of `RmqRpcResponseInterceptor` (which wraps RPC responses).
 * It ONLY processes HTTP context — non-HTTP contexts (e.g. RPC) are passed through untouched.
 */
@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const contextType: ContextType = context.getType();
    if (contextType !== 'http') return next.handle();

    const request: Request = context.switchToHttp().getRequest();
    if (request.url.includes('/metrics')) return next.handle();

    return next.handle().pipe(
      map((result: T) => {
        return {
          success: true,
          data: result,
        };
      }),
    );
  }
}
