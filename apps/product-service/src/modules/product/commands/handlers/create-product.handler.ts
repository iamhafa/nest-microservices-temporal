import { AppException } from '@libs/common/exception/app-exception';
import { ProductErrorCode } from '@libs/contract/product/error';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { CreateProductCommand } from '../implements/create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly clsService: ClsService,
    private readonly temporalService: TemporalService,
  ) {}

  async execute(command: CreateProductCommand): Promise<any> {
    const { createProductDto } = command;
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
}
