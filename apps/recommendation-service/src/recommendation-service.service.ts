import { RelatedProductDto } from '@libs/contract/recommendation/dto';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecommendationServiceService {
  private readonly logger = new Logger(RecommendationServiceService.name);

  async getRelatedProducts(productId: number): Promise<RelatedProductDto[]> {
    this.logger.warn(`getRelatedProducts for ID ${productId} requested: Vector embedding and similarity features have been disabled.`);
    return [];
  }
}
