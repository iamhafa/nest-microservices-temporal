import { SharedRabbitMQModule } from '@libs/common/rabbitmq';
import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [RecommendationController],
})
export class RecommendationModule {}
