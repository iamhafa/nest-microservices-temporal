import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { OrderController } from './order.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ORDER_SERVICE_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService, ClsService],
        useFactory: (configService: ConfigService, clsService: ClsService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'order-service-queue',
            queueOptions: {
              durable: true, // if false, queue will be deleted when rabbitmq restart
            },
            headers: {
              ['X-Correlation-Id']: clsService.getId(),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [OrderController],
})
export class OrderModule {}
