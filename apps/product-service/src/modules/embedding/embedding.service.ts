import { FeatureExtractionPipeline, pipeline, Tensor } from '@huggingface/transformers';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isEmpty, isString } from 'lodash';
import { ProductEntity } from '../product/entity/product.entity';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private pipe: FeatureExtractionPipeline;
  private readonly embeddingModel: string = 'Xenova/all-MiniLM-L6-v2';

  async onModuleInit(): Promise<void> {
    this.logger.log(`Loading ${this.embeddingModel} model...`);
    this.pipe = await pipeline('feature-extraction', this.embeddingModel);
    this.logger.log(`Model ${this.embeddingModel} loaded successfully.`);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (isEmpty(text)) {
      // Return 384 zero vector if empty
      this.logger.warn('Empty text provided for embedding, returning zero vector');
      return Array(384).fill(0);
    }

    try {
      // Mean pooling directly mimics standard sentence transformer outputs
      const output: Tensor = await this.pipe(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      this.logger.error(`Error generating embedding for text: ${text.substring(0, 50)}...`, error);
      throw error;
    }
  }

  buildProductText(product: ProductEntity): string {
    const parts = [product.name, product.description];
    if (product.category?.name) parts.push(product.category.name);
    if (product.brand?.name) parts.push(product.brand.name);

    // Extract tag names if they exist and are populated
    if (product.tags && Array.isArray(product.tags)) {
      parts.push(...product.tags.map(t => t.name).filter(Boolean));
    }

    // Extract attributes
    if (product.attributes) {
      parts.push(...Object.values(product.attributes).filter(val => isString(val)));
    }

    return parts.filter(Boolean).join(' ').trim();
  }
}
