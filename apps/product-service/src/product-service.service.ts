import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { UpdateProductDto } from '@libs/contract/product/dto/update-product.dto';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { In } from 'typeorm';
import { ProductTagEntity } from './entity/product-tag.entity';
import { ProductEntity } from './entity/product.entity';
import { ProductBrandRepository } from './repository/product-brand.repository';
import { ProductCategoryRepository } from './repository/product-category.repository';
import { ProductTagRepository } from './repository/product-tag.repository';
import { ProductRepository } from './repository/product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly clsService: ClsService,
    private readonly temporalService: TemporalService,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: ProductCategoryRepository,
    private readonly brandRepository: ProductBrandRepository,
    private readonly tagRepository: ProductTagRepository,
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
      throw workFlowResponse.error ?? new Error('Failed to start workflow');
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
      throw new RpcException({ status: 404, message: `Product #${id} not found` });
    }

    return product;
  }

  async updateProduct(updateProductDto: UpdateProductDto): Promise<any> {
    const { id, category_id, brand_id, tag_ids, ...productData } = updateProductDto;

    // 1. Validate Category if provided
    if (category_id) {
      const category = await this.categoryRepository.findOneBy({ id: category_id });
      if (!category) {
        throw new RpcException({ status: 400, message: `Category #${category_id} not found` });
      }
    }

    // 2. Validate Brand if provided
    if (brand_id) {
      const brand = await this.brandRepository.findOneBy({ id: brand_id });
      if (!brand) {
        throw new RpcException(`Brand #${brand_id} not found`);
      }
    }

    // 3. Validate Tags if provided
    let tags: Pick<ProductTagEntity, 'id'>[] = [];
    if (tag_ids && tag_ids.length > 0) {
      const foundTags = await this.tagRepository.find({
        where: { id: In(tag_ids) },
      });

      const foundIds = foundTags.map(t => t.id);
      const missingIds = tag_ids.filter(id => !foundIds.includes(id));

      if (missingIds.length > 0) {
        throw new RpcException(`Tags not found: ${missingIds.join(', ')}`);
      }

      // Prepare shorthand objects for relation update
      tags = tag_ids.map(id => ({ id }));
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
      throw new RpcException(`Product #${id} not found`);
    }

    await this.productRepository.save(productToUpdate);

    return {
      message: 'Product updated successfully',
      id,
    };
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProduct(id);
    await this.productRepository.softDelete(product.id);
  }
}
