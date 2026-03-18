import { CancelOrderRequestDto } from '@libs/contract/order/dto/cancel-order-request.dto';
import { CancelOrderResponseDto } from '@libs/contract/order/dto/cancel-order-response.dto';
import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
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
    const workFlowResponse: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'placeOrderWorkflow',
      [createOrderDto, orderSaved.id],
      {
        taskQueue: WorkFlowTaskQueue.ORDER,
        workflowId,
      },
    );

    if (!workFlowResponse.success) {
      throw workFlowResponse.error ?? new Error('Failed to start workflow');
    }

    return {
      order_id: orderSaved.id,
      status: orderSaved.status,
      message: 'Order processed successfully',
    };
  }

  async getOrder(orderId: number): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });

    if (!order) {
      throw new RpcException({ status: 404, message: `Order #${orderId} not found` });
    }

    return order;
  }

  async cancelOrder(cancelOrderDto: CancelOrderRequestDto): Promise<CancelOrderResponseDto> {
    const order: OrderEntity = await this.getOrder(cancelOrderDto.order_id);

    if (!order.isCancelable) {
      throw new RpcException({
        status: 400,
        message: `Order ${order.id} cannot be cancelled because it is in ${order.status} status.`,
      });
    }

    const workflowId: string = `cancel_order_${order.id}`;
    const response: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'cancelOrderWorkflow',
      [cancelOrderDto, order.id],
      {
        taskQueue: WorkFlowTaskQueue.ORDER,
        workflowId,
      },
    );

    if (!response.success) {
      throw response.error ?? new Error('Failed to start cancel workflow');
    }

    return {
      order_id: order.id,
      status: 'Cancelling',
      message: 'Cancel order workflow started successfully',
      cancelled_at: new Date(),
    };
  }
}
