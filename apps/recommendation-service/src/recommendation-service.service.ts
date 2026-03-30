import { RelatedProductDto } from '@libs/contract/recommendation';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { GeminiService } from './gemini.service';

@Injectable()
export class RecommendationServiceService {
  private readonly logger = new Logger(RecommendationServiceService.name);

  constructor(
    @Inject('PRODUCT_SERVICE_CLIENT') private readonly productServiceClient: ClientProxy,
    private readonly geminiService: GeminiService,
  ) {}

  async getRelatedProducts(productId: number): Promise<RelatedProductDto[]> {
    this.logger.log(`Fetching related products for product ID: ${productId}`);

    // 1. Get product metadata from product-service
    const product = await firstValueFrom(
      this.productServiceClient.send({ cmd: 'get-product' }, productId),
    );

    if (!product) {
      throw new Error('Product not found in product-service');
    }

    // 2. Call Gemini for recommendations based on metadata
    return this.geminiService.getRelatedProducts(product);
  }
}
