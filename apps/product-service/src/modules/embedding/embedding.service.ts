import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ProductEntity } from '../product/entity/product.entity';

// Optional: Ensure local storage for downloaded models so they don't get redownloaded each time if configured
// env.allowLocalModels = true;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private pipe: FeatureExtractionPipeline;

  async onModuleInit() {
    this.logger.log('Loading Xenova/all-MiniLM-L6-v2 model...');
    try {
      this.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        // You might consider quantized models for faster loading if memory is tight,
        // default uses quantized weights where available in xenova
      });
      this.logger.log('Model Xenova/all-MiniLM-L6-v2 loaded successfully.');
    } catch (error) {
      this.logger.error('Failed to load text embedding model', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      // Return 384 zero vector if empty
      this.logger.warn('Empty text provided for embedding, returning zero vector');
      return Array(384).fill(0);
    }

    try {
      // Mean pooling directly mimics standard sentence transformer outputs
      const output = await this.pipe(text, { pooling: 'mean', normalize: true });
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
      parts.push(...Object.values(product.attributes).filter(val => typeof val === 'string'));
    }

    return parts.filter(Boolean).join(' ').trim();
  }
}
