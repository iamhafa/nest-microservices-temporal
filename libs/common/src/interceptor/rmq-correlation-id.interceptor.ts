import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import { Observable, Subscriber, Subscription } from 'rxjs';

@Injectable()
export class RmqCorrelationIdInterceptor implements NestInterceptor {
  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Subscription> {
    if (context.getType() === 'rpc') {
      const rmqContext: RmqContext = context.switchToRpc().getContext();
      // RabbitMQ message properties
      const properties = rmqContext.getMessage()?.properties;
      const correlationId: string = properties?.headers?.['X-Correlation-Id'] || randomUUID();

      // Wrap the request handler in a CLS context.
      // Because NestJS interceptors are Observable-based, we must wrap it at subscription time.
      return new Observable((subscriber: Subscriber<Subscription>) => {
        this.clsService.run(() => {
          this.clsService.set('correlationId', correlationId);

          next.handle().subscribe({
            next: value => subscriber.next(value),
            error: err => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
      });
    }

    return next.handle();
  }
}
