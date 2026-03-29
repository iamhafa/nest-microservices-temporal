import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecommendationServiceService } from './recommendation-service.service';
import { RelatedProductDto } from '@libs/contract/recommendation';

@Controller()
export class RecommendationServiceController {
  constructor(private readonly recommendationService: RecommendationServiceService) {}

  @MessagePattern({ cmd: 'get-related-products' })
  getRelatedProducts(@Payload() productId: number): Promise<RelatedProductDto[]> {
    return this.recommendationService.getRelatedProducts(productId);
  }
}
