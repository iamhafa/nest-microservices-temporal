import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { RecommendationController } from './recommendation.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RECOMMENDATION_SERVICE_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService, ClsService],
        useFactory: (configService: ConfigService, clsService: ClsService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'recommendation-service-queue',
            queueOptions: {
              durable: true,
            },
            headers: {
              ['x-correlation-id']: clsService.getId(),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [RecommendationController],
})
export class RecommendationModule {}
