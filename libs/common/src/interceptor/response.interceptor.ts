import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { type Response } from 'express';
import { has, isObject } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const ctx: HttpArgumentsHost = context.switchToHttp();
    const response: Response = ctx.getResponse();

    return next.handle().pipe(
      map((result: T) => {
        const hasCustomShape: boolean = isObject(result) && (has(result, 'data') || has(result, 'meta'));
        const objResult = result as any;

        return {
          success: true,
          status_code: response.statusCode,
          message: hasCustomShape && objResult.message ? objResult.message : 'Successful',
          data: hasCustomShape && objResult.data !== undefined ? objResult.data : result,
          ...(hasCustomShape && objResult.meta ? { meta: objResult.meta } : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
