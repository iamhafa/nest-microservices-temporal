import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor/rmq-correlation-id.interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { RecommendationServiceController } from './recommendation-service.controller';
import { RecommendationServiceService } from './recommendation-service.service';

@Module({
  imports: [
    // Core Modules
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/recommendation-service/.env'), join(cwd(), '.env')],
    }),
    ClientsModule.registerAsync([
      {
        name: 'PRODUCT_SERVICE_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'product-service-queue',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),

    // Custom dynamic modules
    SharedLoggerModule,
  ],
  controllers: [RecommendationServiceController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    RecommendationServiceService,
  ],
})
export class RecommendationServiceModule {}
