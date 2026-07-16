import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { AppException } from '@libs/common';
import {
  type ICancelOrderDto,
  type ICreateOrderDto,
  type IUpdateOrderStatusDto,
  OrderErrorCode,
} from '@libs/contract/order';
import { RmqExchange, RmqQueue, RmqRoutingKey } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TemporalService, WorkflowExecutionResult } from 'nestjs-temporal-core';
import { OrderEntity } from './entity/order.entity';
import { OrderRepository } from './repository/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly clsService: ClsService,
    private readonly temporalService: TemporalService,
    private readonly orderRepository: OrderRepository,
  ) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: RmqRoutingKey.ORDER_CREATE,
    queue: RmqQueue.ORDER_QUEUE,
  })
  async createOrder(@RabbitPayload() createOrderDto: ICreateOrderDto): Promise<any> {
    // Get correlationId from CLS
    const correlationId: string = this.clsService.get('correlationId');
    const workflowId: string = `place-order:${correlationId}`;

    // Get userId from CLS
    const userId = this.clsService.get('userId');

    const workFlowResponse: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'placeOrderWorkflow',
      [createOrderDto, userId],
      {
        taskQueue: WorkFlowTaskQueue.ORDER,
        workflowId,
      },
    );

    if (!workFlowResponse.success) {
      throw (
        workFlowResponse.error ??
        new AppException({
          code: OrderErrorCode.WORKFLOW_FAILED,
          message: 'Failed to start workflow',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        })
      );
    }

    return {
      workflowId,
      message: 'Order placement initiated',
    };
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'order.get',
    queue: RmqQueue.ORDER_QUEUE,
  })
  async getOrder(@RabbitPayload() orderId: number): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });

    if (!order) {
      throw new AppException({
        code: OrderErrorCode.NOT_FOUND,
        message: `Order #${orderId} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    return order;
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: RmqRoutingKey.ORDER_CANCEL,
    queue: RmqQueue.ORDER_QUEUE,
  })
  async cancelOrder(@RabbitPayload() cancelOrderDto: ICancelOrderDto): Promise<any> {
    const order: OrderEntity = await this.getOrder(cancelOrderDto.order_id);

    if (!order.isCancelable) {
      throw new AppException({
        code: OrderErrorCode.NOT_CANCELABLE,
        message: `Order ${order.id} cannot be cancelled because it is in ${order.status} status.`,
      });
    }

    // Get correlationId from CLS
    const correlationId: string = this.clsService.get('correlationId');
    const workflowId: string = `cancel-order:${correlationId}`;

    const workFlowResponse: WorkflowExecutionResult = await this.temporalService.startWorkflow(
      'cancelOrderWorkflow',
      [cancelOrderDto],
      {
        taskQueue: WorkFlowTaskQueue.ORDER,
        workflowId,
      },
    );

    if (!workFlowResponse.success) {
      throw workFlowResponse.error ?? new Error('Failed to start cancel workflow');
    }

    return {
      order_id: order.id,
      status: 'Cancelling',
      message: 'Cancel order workflow started successfully',
      cancelled_at: new Date(),
    };
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'order.getAll',
    queue: RmqQueue.ORDER_QUEUE,
  })
  getOrders(): Promise<OrderEntity[]> {
    return this.orderRepository.find({
      relations: { items: true },
      order: { created_at_utc: 'DESC' },
    });
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'order.getMyOrders.query',
    queue: RmqQueue.ORDER_QUEUE,
  })
  getMyOrders(): Promise<OrderEntity[]> {
    const userId: number = this.clsService.get('userId');
    return this.orderRepository.find({
      where: { user_id: userId },
      relations: { items: true },
      order: { created_at_utc: 'DESC' },
    });
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'order.updateStatus',
    queue: RmqQueue.ORDER_QUEUE,
  })
  async updateOrderStatus(@RabbitPayload() updateOrderStatusDto: IUpdateOrderStatusDto): Promise<OrderEntity> {
    const order: OrderEntity = await this.getOrder(updateOrderStatusDto.order_id);
    order.status = updateOrderStatusDto.status;
    return this.orderRepository.save(order);
  }
}
