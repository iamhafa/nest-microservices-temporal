import { defaultNackErrorHandler, MessageHandlerErrorBehavior, RabbitMQConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RmqExchange } from '../enum/exchange/rmq-exchange.enum';
import { RmqContextInterceptor } from '../interceptor/rmq-context.interceptor';
import { RmqRpcResponseInterceptor } from '../interceptor/rmq-rpc-response.interceptor';
import { RmqPublisherService } from '../publisher/rmq-publisher.service';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RabbitMQConfig => ({
        uri: configService.getOrThrow<string>('RABBITMQ_URL'),
        exchanges: [
          {
            name: RmqExchange.ECOMMERCE,
            type: 'topic',
          },
          {
            name: RmqExchange.ECOMMERCE_DLX, // Dead Letter Exchange để handle message lỗi
            type: 'topic',
          },
        ],
        connectionInitOptions: {
          wait: false,
          timeout: 20000,
        },
        prefetchCount: 10, // RabbitMQ sẽ chỉ gửi tối đa 10 messages chưa được ACK cho Consumer đó tại một thời điểm.
        /**
         * Thiết lập cơ chế xử lý lỗi mặc định cho toàn bộ các handler dùng @RabbitRPC.
         * `defaultNackErrorHandler` sẽ thực hiện lệnh NACK(requeue = false) khi có bất kỳ Exception nào bị ném ra.
         * Nhờ requeue = false, message sẽ không bị lặp vô tận mà được RabbitMQ đưa thẳng vào Dead Letter Exchange (DLX).
         */
        defaultRpcErrorHandler: defaultNackErrorHandler,
        /**
         * Thiết lập tương tự cho các handler dùng @RabbitSubscribe.
         * Nếu có lỗi, message cũng sẽ bị NACK và không được requeue, chuyển thẳng tới DLX.
         */
        defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
      }),
    }),
  ],
  providers: [
    RmqPublisherService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqRpcResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
  ],
  exports: [RmqPublisherService],
})
export class SharedRabbitMQModule {}
