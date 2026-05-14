import { AppException } from '@libs/common/exception/app-exception';
import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';
import { ProductErrorCode } from '@libs/contract/product/error';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { In, IsNull } from 'typeorm';
import { EmbeddingService } from '../embedding/embedding.service';
import { ProductBrandRepository } from '../product-brand/repository/product-brand.repository';
import { ProductCategoryRepository } from '../product-category/repository/product-category.repository';
import { ProductTagEntity } from '../product-tag/entity/product-tag.entity';
import { ProductTagRepository } from '../product-tag/repository/product-tag.repository';
import { ProductEntity } from './entity/product.entity';
import { ProductRepository } from './repository/product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly clsService: ClsService,
    private readonly temporalService: TemporalService,
    private readonly embeddingService: EmbeddingService,
    private readonly productRepository: ProductRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productBrandRepository: ProductBrandRepository,
    private readonly productTagRepository: ProductTagRepository,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<any> {
    const correlationId: string = this.clsService.get('correlationId');
    const workflowId: string = `create-product:${correlationId}`;

    const workFlowResponse: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'createProductWorkflow',
      [createProductDto],
      {
        taskQueue: WorkFlowTaskQueue.PRODUCT,
        workflowId,
      },
    );

    if (!workFlowResponse.success) {
      throw (
        workFlowResponse.error ??
        new AppException({
          code: ProductErrorCode.NOT_FOUND,
          message: 'Failed to start workflow',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        })
      );
    }

    return {
      message: 'Product creation initiated successfully',
      workflowId,
    };
  }

  getProducts(): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: { is_active: true },
      relations: { category: true, brand: true, tags: true },
    });
  }

  async getProduct(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: { id, is_active: true },
      relations: { category: true, brand: true, tags: true },
    });

    if (!product) {
      throw new AppException({
        code: ProductErrorCode.NOT_FOUND,
        message: `Product #${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    return product;
  }

  async updateProduct(updateProductDto: UpdateProductDto): Promise<any> {
    const { id, category_id, brand_id, tag_ids, ...productData } = updateProductDto;

    // 1. Validate Category if provided
    if (category_id) {
      const category = await this.productCategoryRepository.findOneBy({ id: category_id });
      if (!category) {
        throw new AppException({
          code: ProductErrorCode.CATEGORY_NOT_FOUND,
          message: `Category #${category_id} not found`,
        });
      }
    }

    // 2. Validate Brand if provided
    if (brand_id) {
      const brand = await this.productBrandRepository.findOneBy({ id: brand_id });
      if (!brand) {
        throw new AppException({
          code: ProductErrorCode.BRAND_NOT_FOUND,
          message: `Brand #${brand_id} not found`,
        });
      }
    }

    // 3. Validate Tags if provided
    let tags: Pick<ProductTagEntity, 'id'>[] = [];
    if (tag_ids && tag_ids.length > 0) {
      const foundTags: ProductTagEntity[] = await this.productTagRepository.find({
        where: {
          id: In(tag_ids),
        },
      });

      const foundIds = new Set(foundTags.map(t => t.id));
      const missingIds = tag_ids.filter(id => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new AppException({
          code: ProductErrorCode.TAG_NOT_FOUND,
          message: `Tags not found: ${missingIds.join(', ')}`,
        });
      }

      // Prepare shorthand objects for relation update
      tags = tag_ids.map((id: number) => ({ id }));
    }

    // 4. Preload and Save (Handle partial updates and relationships)
    const productToUpdate = await this.productRepository.preload({
      id,
      category_id,
      brand_id,
      tags,
      ...productData,
    });

    if (!productToUpdate) {
      throw new AppException({
        code: ProductErrorCode.NOT_FOUND,
        message: `Product #${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    await this.productRepository.save(productToUpdate);

    return {
      message: 'Product updated successfully',
      id,
    };
  }

  async deleteProduct(id: number): Promise<void> {
    const product: ProductEntity = await this.getProduct(id);
    await this.productRepository.softDelete(product.id);
  }

  async updateEmbedding(productId: number, embedding: number[]): Promise<void> {
    const vectorString: string = `[${embedding.join(',')}]`;
    await this.productRepository
      .createQueryBuilder()
      .update()
      .set({ embedding: vectorString })
      .where('id = :productId', { productId })
      .execute();
  }

  async findSimilarProducts(productId: number, limit: number = 10): Promise<any[]> {
    // We select embedding explicitly using query builder since it's select: false
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
      select: {
        embedding: true,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
      },
    });

    if (!product) {
      throw new AppException({
        code: ProductErrorCode.NOT_FOUND,
        message: `Product #${productId} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    let embeddingStr: any = product.embedding;

    // Lazy evaluation if embedding does not exist yet
    if (!embeddingStr) {
      const text: string = this.embeddingService.buildProductText(product);
      const embedding: number[] = await this.embeddingService.generateEmbedding(text);
      await this.updateEmbedding(productId, embedding);
      embeddingStr = `[${embedding.join(',')}]`;
    } else if (Array.isArray(embeddingStr)) {
      // TypeORM/pg driver might parse the vector column into a JS Array.
      // We must explicitly format it back to the pgvector '[val1, val2]' string format for the raw query.
      embeddingStr = JSON.stringify(embeddingStr);
    }

    // Perform cosine similarity search (1 - (<=> distance))
    // We use QueryBuilder for pgvector "<=>" distance operator and mapping
    const similarProducts = await this.productRepository.findSimilarProducts(productId, embeddingStr, limit);

    return similarProducts;
  }

  async backfillEmbeddings(): Promise<any> {
    // Find all products that do not have an embedding
    const products: ProductEntity[] = await this.productRepository.find({
      where: {
        embedding: IsNull(),
        is_active: true,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
      },
    });

    // Process each product to generate and update embedding
    let processed: number = 0;
    for (const product of products) {
      const text: string = this.embeddingService.buildProductText(product);
      const embedding: number[] = await this.embeddingService.generateEmbedding(text);
      await this.updateEmbedding(product.id, embedding);
      processed++;
    }

    return {
      processed,
      total: products.length,
    };
  }
}
