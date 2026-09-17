import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, ExecutionContext, Module } from '@nestjs/common';
import { ConsumeMessage, MessagePropertyHeaders } from 'amqplib';
import { ClsModule, ClsService } from 'nestjs-cls';

/**
 * @description Cấu hình CLS cho các microservices để trích xuất `correlationId` và `userId` từ RabbitMQ message header.
 * Không dùng cho `api-gateway` (dùng HTTP middleware) và `orchestrator-worker` (chạy Temporal).
 */
@Module({})
export class SharedClsModule {
  static forRoot(): DynamicModule {
    return {
      module: SharedClsModule,
      imports: [
        ClsModule.forRoot({
          global: true,
          interceptor: {
            mount: true,
            setup: (clsService: ClsService, context: ExecutionContext): void => {
              if (!isRabbitContext(context)) return;

              const amqpMsg: ConsumeMessage = context.getArgByIndex(1);
              const headers: MessagePropertyHeaders = amqpMsg.properties.headers ?? {};

              // Được truyền qua RmqPublisherService
              const correlationId: string = headers['X-Correlation-Id'];
              // Được truyền qua RmqPublisherService từ thông tin JWT
              const userId: number | undefined = headers['X-User-Id'];

              clsService.set('correlationId', correlationId);
              if (userId) {
                clsService.set('userId', userId);
              }
            },
          },
        }),
      ],
    };
  }
}
