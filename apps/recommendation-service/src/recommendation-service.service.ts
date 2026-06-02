import { RabbitRPC, RabbitPayload } from '@golevelup/nestjs-rabbitmq';
import { RmqExchange, RmqQueue } from '@libs/contract/rabbitmq/constants';
import { RelatedProductDto } from '@libs/contract/recommendation/dto';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecommendationServiceService {
  private readonly logger = new Logger(RecommendationServiceService.name);

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'recommendation.getRelatedProducts',
    queue: RmqQueue.RECOMMENDATION_QUEUE,
  })
  async getRelatedProducts(@RabbitPayload() productId: number): Promise<RelatedProductDto[]> {
    this.logger.warn(`getRelatedProducts for ID ${productId} requested: Vector embedding and similarity features have been disabled.`);
    return [];
  }
}
