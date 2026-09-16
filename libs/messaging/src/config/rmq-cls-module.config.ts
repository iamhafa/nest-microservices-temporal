import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { ExecutionContext } from '@nestjs/common';
import { ConsumeMessage, MessagePropertyHeaders } from 'amqplib';
import { ClsModuleOptions, ClsService } from 'nestjs-cls';

export const rmqClsModuleConfig: ClsModuleOptions = {
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
};
