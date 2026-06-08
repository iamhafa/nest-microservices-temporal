import {
  defaultNackErrorHandler,
  MessageHandlerErrorBehavior,
  RabbitMQConfig,
  RabbitMQModule,
} from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RmqExchange } from './enum/rmq-exchange.enum';
import { RmqPublisherService } from './rmq-publisher.service';

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
  providers: [RmqPublisherService],
  exports: [RmqPublisherService],
})
export class SharedRabbitMQModule {}
