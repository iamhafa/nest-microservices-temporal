import { RelatedProductDto } from '@libs/contract/recommendation';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RecommendationServiceService {
  private readonly logger = new Logger(RecommendationServiceService.name);

  constructor(@Inject('PRODUCT_SERVICE_CLIENT') private readonly productServiceClient: ClientProxy) {}

  async getRelatedProducts(productId: number): Promise<RelatedProductDto[]> {
    this.logger.log(`Fetching similar products for product ID: ${productId} via product-service directly`);

    const similarProducts: RelatedProductDto[] = await firstValueFrom(
      this.productServiceClient.send(
        {
          cmd: 'find-similar-products',
        },
        {
          productId,
          limit: 10,
        },
      ),
    );

    return similarProducts;
  }
}
