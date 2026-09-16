import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { OrderErrorCode, type ICancelOrderDto, type ICreateOrderDto, type IUpdateOrderStatusDto } from '@libs/contract/order';
import { OrderRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    routingKey: OrderRoutingKey.CREATE,
    queue: RmqQueue.ORDER_QUEUE,
  })
  async createOrder(@RabbitPayload() createOrderDto: ICreateOrderDto): Promise<any> {
    // Get correlationId from CLS
    const correlationId: string = this.clsService.get('correlationId');
    const workflowId: string = `place-order:${correlationId}`;

    // Get userId from CLS
    const userId: number = this.clsService.get('userId');

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
        new InternalServerErrorException('Failed to start workflow', {
          errorCode: OrderErrorCode.WORKFLOW_FAILED,
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
    routingKey: OrderRoutingKey.GET_BY_ID,
    queue: RmqQueue.ORDER_QUEUE,
  })
  async getOrder(@RabbitPayload() orderId: number): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
      },
      relations: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`, {
        errorCode: OrderErrorCode.NOT_FOUND,
      });
    }

    return order;
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: OrderRoutingKey.CANCEL,
    queue: RmqQueue.ORDER_QUEUE,
  })
  async cancelOrder(@RabbitPayload() cancelOrderDto: ICancelOrderDto): Promise<any> {
    const order: OrderEntity = await this.getOrder(cancelOrderDto.order_id);

    if (!order.isCancelable) {
      throw new BadRequestException(`Order ${order.id} cannot be cancelled because it is in ${order.status} status.`, {
        errorCode: OrderErrorCode.NOT_CANCELABLE,
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
      throw (
        workFlowResponse.error ??
        new InternalServerErrorException('Failed to start cancel workflow', {
          errorCode: OrderErrorCode.WORKFLOW_FAILED,
        })
      );
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
    routingKey: OrderRoutingKey.GET_ALL,
    queue: RmqQueue.ORDER_QUEUE,
  })
  getOrders(): Promise<OrderEntity[]> {
    return this.orderRepository.find({
      relations: {
        items: true,
      },
    });
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: OrderRoutingKey.GET_MY_ORDERS,
    queue: RmqQueue.ORDER_QUEUE,
  })
  getMyOrders(): Promise<OrderEntity[]> {
    const userId: number = this.clsService.get('userId');

    return this.orderRepository.find({
      where: {
        user_id: userId,
      },
      relations: {
        items: true,
      },
    });
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: OrderRoutingKey.UPDATE_STATUS,
    queue: RmqQueue.ORDER_QUEUE,
  })
  async updateOrderStatus(@RabbitPayload() updateOrderStatusDto: IUpdateOrderStatusDto): Promise<OrderEntity> {
    const order: OrderEntity = await this.getOrder(updateOrderStatusDto.order_id);
    order.status = updateOrderStatusDto.status;
    return this.orderRepository.save(order);
  }
}
