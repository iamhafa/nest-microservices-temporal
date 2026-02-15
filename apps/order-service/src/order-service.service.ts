import { CreateOrderRequestDto, CreateOrderResponseDto } from '@contract/order';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { Repository } from 'typeorm';
import { OrderEntity } from './entity/order.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly temporalService: TemporalService,
    @InjectRepository(OrderEntity) private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async createOrder(createOrderDto: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
    const order: OrderEntity = this.orderRepository.create({
      status: 'CREATED',
      address: createOrderDto.address,
      email: createOrderDto.email,
    });
    const orderSaved: OrderEntity = await this.orderRepository.save(order);

    const workflowId: string = `order_${orderSaved.id}`;
    const response: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'processOrderWorkflow',
      [createOrderDto, orderSaved.id],
      {
        taskQueue: WorkFlowTaskQueue.ORDER,
        workflowId,
      },
    );

    if (!response.success) {
      throw response.error ?? new Error('Failed to start workflow');
    }

    return {
      order_id: orderSaved.id,
      status: orderSaved.status,
      message: 'Order created successfully',
    };
  }
}
