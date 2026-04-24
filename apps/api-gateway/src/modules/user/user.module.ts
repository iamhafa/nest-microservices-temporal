import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { UserController } from './user.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService, ClsService],
        useFactory: (configService: ConfigService, clsService: ClsService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'user-service-queue',
            queueOptions: {
              durable: true,
            },
            headers: {
              ['X-Correlation-Id']: clsService.getId(),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
