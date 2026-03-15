import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { OrderEntity } from './entity/order.entity';
import { OrderRepository } from './repository/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly temporalService: TemporalService,
    private readonly orderRepository: OrderRepository,
  ) {}

  async createOrder(createOrderDto: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
    const totalAmount: number = createOrderDto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order: OrderEntity = this.orderRepository.create({
      status: OrderStatus.PENDING,
      address: createOrderDto.address,
      email: createOrderDto.email,
      total_amount: totalAmount,
      items: createOrderDto.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
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

  async getOrder(orderId: number): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    return order;
  }
}
