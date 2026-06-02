import { Module } from '@nestjs/common';
import { RabbitMQConfig, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqExchange } from '@libs/contract/rabbitmq/constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
        ],
        connectionInitOptions: {
          wait: false,
          timeout: 20000,
        },
      }),
    }),
  ],
  providers: [RmqPublisherService],
  exports: [RmqPublisherService],
})
export class SharedRabbitMQModule {}
