import { IGenerateProductEmbedding } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EmbeddingService } from '../modules/embedding/embedding.service';
import { ProductRepository } from '../modules/product/repository/product.repository';
import { ProductService } from '../modules/product/product.service';

@Activity({ name: 'generate-product-embedding-activity' })
export class GenerateProductEmbeddingActivity implements IGenerateProductEmbedding {
  private readonly logger = new Logger(GenerateProductEmbeddingActivity.name);

  constructor(
    private readonly productService: ProductService,
    private readonly embeddingService: EmbeddingService,
    private readonly productRepository: ProductRepository,
  ) {}

  @ActivityMethod({ name: 'generateProductEmbedding' })
  async execute(productId: number): Promise<void> {
    this.logger.log(`Generating embedding for product ${productId}`);
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
      },
    });

    if (!product) {
      this.logger.warn(`Product ${productId} not found for embedding generation`);
      return;
    }

    const text: string = this.embeddingService.buildProductText(product);
    const embedding: number[] = await this.embeddingService.generateEmbedding(text);

    await this.productService.updateEmbedding(productId, embedding);
    this.logger.log(`Embedding generated and saved for product ${productId}`);
  }
}
