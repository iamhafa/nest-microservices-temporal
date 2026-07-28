import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { ClsService } from 'nestjs-cls';
import { Observable, Subscriber, Subscription } from 'rxjs';

@Injectable()
export class RmqContextInterceptor implements NestInterceptor {
  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Subscription> {
    if (isRabbitContext(context)) {
      const amqpMsg: ConsumeMessage = context.getArgByIndex(1);
      // Được truyền qua RmqPublisherService
      const correlationId = amqpMsg.properties.headers?.['X-Correlation-Id'] as string;
      // Được truyền qua RmqPublisherService từ thông tin JWT
      const userId = amqpMsg.properties.headers?.['X-User-Id'] as number | undefined;

      // Wrap the request handler in a CLS context.
      // Because NestJS interceptors are Observable-based, we must wrap it at subscription time.
      return new Observable((subscriber: Subscriber<Subscription>) => {
        this.clsService.run(() => {
          this.clsService.set('correlationId', correlationId);
          if (userId) {
            this.clsService.set('userId', userId);
          }

          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
      });
    }

    return next.handle();
  }
}
