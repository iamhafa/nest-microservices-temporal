import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { AppException } from '@libs/common';
import type { ICreateProductDto, IUpdateProductDto } from '@libs/contract/product';
import { ProductErrorCode } from '@libs/contract/product';
import { ProductRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { In } from 'typeorm';
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
    private readonly productRepository: ProductRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productBrandRepository: ProductBrandRepository,
    private readonly productTagRepository: ProductTagRepository,
  ) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductRoutingKey.CREATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async createProduct(@RabbitPayload() createProductDto: ICreateProductDto): Promise<{ message: string; workflowId: string }> {
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

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductRoutingKey.GET_ALL,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  getProducts(): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: {
        is_active: true,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
        images: true,
      },
      select: {
        category: {
          id: true,
          name: true,
          slug: true,
        },
        brand: {
          id: true,
          name: true,
        },
        tags: {
          id: true,
          name: true,
        },
        images: {
          id: true,
          image_url: true,
          is_thumbnail: true,
        },
      },
    });
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductRoutingKey.GET_BY_ID,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async getProduct(@RabbitPayload() id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: {
        id,
        is_active: true,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
        images: true,
      },
      select: {
        category: { id: true, name: true, slug: true },
        brand: { id: true, name: true },
        tags: { id: true, name: true },
        images: { id: true, image_url: true, is_thumbnail: true },
      },
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

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductRoutingKey.UPDATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async updateProduct(@RabbitPayload() updateProductDto: IUpdateProductDto): Promise<any> {
    const { id, category_id, brand_id, tag_ids, image_urls, ...productData } = updateProductDto;

    // 1. Map image_urls to ProductImageEntity objects if provided
    const images = image_urls?.map((url: string, index: number) => ({
      image_url: url,
      is_thumbnail: index === 0,
    }));

    // 2. Validate Category if provided
    if (category_id) {
      const category = await this.productCategoryRepository.findOneBy({ id: category_id });
      if (!category) {
        throw new AppException({
          code: ProductErrorCode.CATEGORY_NOT_FOUND,
          message: `Category #${category_id} not found`,
        });
      }
    }

    // 3. Validate Brand if provided
    if (brand_id) {
      const brand = await this.productBrandRepository.findOneBy({ id: brand_id });
      if (!brand) {
        throw new AppException({
          code: ProductErrorCode.BRAND_NOT_FOUND,
          message: `Brand #${brand_id} not found`,
        });
      }
    }

    // 4. Validate Tags if provided
    let tags: Pick<ProductTagEntity, 'id'>[] = [];
    if (tag_ids && tag_ids.length > 0) {
      const foundTags: ProductTagEntity[] = await this.productTagRepository.find({
        where: {
          id: In(tag_ids),
        },
      });

      const foundIds = new Set(foundTags.map((t) => t.id));
      const missingIds = tag_ids.filter((id: number) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new AppException({
          code: ProductErrorCode.TAG_NOT_FOUND,
          message: `Tags not found: ${missingIds.join(', ')}`,
        });
      }

      // Prepare shorthand objects for relation update
      tags = tag_ids.map((id: number) => ({ id }));
    }

    // 5. Preload and Save (Handle partial updates and relationships)
    const productToUpdate = await this.productRepository.preload({
      id,
      category_id,
      brand_id,
      tags,
      images,
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

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductRoutingKey.DELETE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async deleteProduct(@RabbitPayload() id: number): Promise<void> {
    const product = await this.getProduct(id);
    await this.productRepository.softDelete(product.id);
  }
}
