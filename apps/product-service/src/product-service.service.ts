import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { Injectable } from '@nestjs/common';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { ProductEntity } from './entity/product.entity';
import { ProductRepository } from './repository/product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly temporalService: TemporalService,
    private readonly productRepository: ProductRepository,
  ) {}

  async createProduct(createProductRequestDto: CreateProductRequestDto): Promise<any> {
    const workflowId: string = `create-product-${Date.now()}`;
    const workFlowResponse: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'createProductWorkflow',
      [createProductRequestDto],
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
}
