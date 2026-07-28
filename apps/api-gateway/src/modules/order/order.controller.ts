import { Idempotent } from '@libs/common';
import { OrderRoutingKey, RmqPublisherService } from '@libs/messaging';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CancelOrderDto, CreateOrderDto, OrderResponseDto, UpdateOrderStatusDto, WorkflowInitiatedResponseDto } from './dto';

@ApiBearerAuth('Authorization')
@ApiTags('Order')
@Controller('orders')
export class OrderController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post('place')
  @HttpCode(HttpStatus.ACCEPTED)
  @Idempotent()
  @ApiOperation({ summary: '⚡ [Workflow Async] Place an order' })
  @ApiAcceptedResponse({ description: 'Order placement initiated', type: WorkflowInitiatedResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createOrder(@Body() createOrderDto: CreateOrderDto): Promise<WorkflowInitiatedResponseDto> {
    return this.rmqPublisher.request<WorkflowInitiatedResponseDto>(OrderRoutingKey.CREATE, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'List of orders', type: [OrderResponseDto] })
  getOrders(): Promise<OrderResponseDto[]> {
    return this.rmqPublisher.request<OrderResponseDto[]>(OrderRoutingKey.GET_ALL, {});
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiOkResponse({ description: 'List of user orders', type: [OrderResponseDto] })
  getMyOrders(): Promise<OrderResponseDto[]> {
    return this.rmqPublisher.request<OrderResponseDto[]>(OrderRoutingKey.GET_MY_ORDERS, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiOkResponse({ description: 'Order details', type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrder(@Param('id', ParseIntPipe) id: number): Promise<OrderResponseDto> {
    return this.rmqPublisher.request<OrderResponseDto>(OrderRoutingKey.GET_BY_ID, id);
  }

  @Patch('status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update order status' })
  @ApiNoContentResponse({ description: 'Order status updated successfully' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto): Promise<void> {
    return this.rmqPublisher.request<void>(OrderRoutingKey.UPDATE_STATUS, updateOrderStatusDto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '⚡ [Workflow Async] Cancel an order' })
  @ApiAcceptedResponse({ description: 'Order cancelled successfully', type: WorkflowInitiatedResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  cancelOrder(@Body() cancelOrderDto: CancelOrderDto): Promise<WorkflowInitiatedResponseDto> {
    return this.rmqPublisher.request<WorkflowInitiatedResponseDto>(OrderRoutingKey.CANCEL, cancelOrderDto);
  }
}
