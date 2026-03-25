import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { RecommendationServiceController } from './recommendation-service.controller';
import { RecommendationServiceService } from './recommendation-service.service';

@Module({
  imports: [SharedLoggerModule, ClsModule.forRoot({ global: true })],
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
