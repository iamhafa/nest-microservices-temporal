import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { RecommendationServiceController } from './recommendation-service.controller';
import { RecommendationServiceService } from './recommendation-service.service';

@Module({
  imports: [SharedLoggerModule],
  controllers: [RecommendationServiceController],
  providers: [RecommendationServiceService],
})
export class RecommendationServiceModule {}
