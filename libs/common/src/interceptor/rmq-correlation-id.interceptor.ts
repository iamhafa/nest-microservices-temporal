import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { ClsService } from 'nestjs-cls';
import { Observable, Subscriber, Subscription } from 'rxjs';
import { ConsumeMessage } from 'amqplib';

@Injectable()
export class RmqCorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RmqCorrelationIdInterceptor.name);

  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Subscription> {
    if (isRabbitContext(context)) {
      const amqpMsg: ConsumeMessage = context.getArgByIndex(1);
      const correlationId: string = amqpMsg.properties.headers?.['X-Correlation-Id'] as string;

      if (!correlationId) {
        this.logger.warn('Correlation ID is required');
        return next.handle();
      }

      // Wrap the request handler in a CLS context.
      // Because NestJS interceptors are Observable-based, we must wrap it at subscription time.
      return new Observable((subscriber: Subscriber<Subscription>) => {
        this.clsService.run(() => {
          this.clsService.set('correlationId', correlationId);

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
