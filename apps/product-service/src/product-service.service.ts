import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { UpdateProductDto } from '@libs/contract/product/dto/update-product.dto';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { ProductEntity } from './entity/product.entity';
import { ProductRepository } from './repository/product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly temporalService: TemporalService,
    private readonly productRepository: ProductRepository,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<any> {
    const workflowId: string = `create-product-${Date.now()}`;
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
    return this.productRepository.findBy({ is_active: true });
  }

  async getProduct(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findOneBy({ id, is_active: true });

    if (!product) {
      throw new RpcException({ status: 404, message: `Product #${id} not found` });
    }

    return product;
  }

  async updateProduct(updateProductDto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.getProduct(updateProductDto.id);

    const { id, ...fieldsToUpdate } = updateProductDto;
    Object.assign(product, fieldsToUpdate);

    return this.productRepository.save(product);
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProduct(id);
    await this.productRepository.softDelete(product.id);
  }
}
