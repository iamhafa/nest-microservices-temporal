import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';
import { CLS_ID, ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';

@Injectable()
export class RmqContextInterceptor implements NestInterceptor {
  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (isRabbitContext(context)) {
      const amqpMsg: ConsumeMessage = context.getArgByIndex(1);
      // Được truyền qua RmqPublisherService hoặc fallback UUID mới
      const correlationId = (amqpMsg.properties.headers?.['X-Correlation-Id'] as string) || randomUUID();
      // Được truyền qua RmqPublisherService từ thông tin JWT
      const userId = amqpMsg.properties.headers?.['X-User-Id'] as number | undefined;

      // Wrap the request handler in a CLS context.
      // Because NestJS interceptors are Observable-based, we must wrap it at subscription time.
      return new Observable((subscriber) => {
        return this.clsService.run(() => {
          this.clsService.set('correlationId', correlationId);
          this.clsService.set(CLS_ID, correlationId);
          if (userId) {
            this.clsService.set('userId', userId);
          }

          return next.handle().subscribe(subscriber);
        });
      });
    }

    return next.handle();
  }
}
