import { CallHandler, ContextType, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { has, isObject } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const contextType: ContextType = context.getType();
    if (contextType === 'http') {
      const request: Request = context.switchToHttp().getRequest();
      if (request.url.includes('/metrics')) return next.handle();
    }

    return next.handle().pipe(
      map((result: T) => {
        const hasCustomShape: boolean = isObject(result) && (has(result, 'data') || has(result, 'meta'));
        const objResult = result as any;

        return {
          success: true,
          data: hasCustomShape && objResult.data !== undefined ? objResult.data : result,
          ...(hasCustomShape && objResult.meta ? { meta: objResult.meta } : {}),
        };
      }),
    );
  }
}
