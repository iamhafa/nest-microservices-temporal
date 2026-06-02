import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { SharedRabbitMQModule } from '@libs/common/rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { RecommendationServiceService } from './recommendation-service.service';

@Module({
  imports: [
    // Core Modules
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/recommendation-service/.env'), join(cwd(), '.env')],
    }),

    // Custom dynamic modules
    SharedRabbitMQModule,
    SharedLoggerModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    RecommendationServiceService,
  ],
})
export class RecommendationServiceModule {}
