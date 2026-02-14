import { CreateOrderDto } from '@contract/order';
import { Injectable } from '@nestjs/common';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { TemporalService } from 'nestjs-temporal-core';

@Injectable()
export class OrderService {
  constructor(private readonly temporalService: TemporalService) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const workflowId: string = `order_${createOrderDto.orderId}`;

    const response = await this.temporalService.startWorkflow('processOrderWorkflow', [createOrderDto], {
      taskQueue: WorkFlowTaskQueue.ORDER,
      workflowId,
    });

    if (!response.success) {
      throw response.error ?? new Error('Failed to start workflow');
    }

    return {
      orderId: createOrderDto.orderId,
      status: 'CREATED',
      message: 'Order created successfully',
    };
  }
}
