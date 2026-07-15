import { Idempotent, RmqPublisherService } from '@libs/common';
import { CancelOrderDto, CreateOrderDto, UpdateOrderStatusDto } from './dto';
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

@ApiBearerAuth('Authorization')
@ApiTags('Order')
@Controller('orders')
export class OrderController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post('place')
  @HttpCode(HttpStatus.ACCEPTED)
  @Idempotent()
  @ApiOperation({ summary: 'Place an order' })
  @ApiAcceptedResponse({ description: 'Order is processing' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createOrder(@Body() createOrderDto: CreateOrderDto): Promise<any> {
    return this.rmqPublisher.request('order.create', createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'List of orders' })
  getOrders(): Promise<any> {
    return this.rmqPublisher.request('order.getAll', {});
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiOkResponse({ description: 'List of user orders' })
  getMyOrders(): Promise<any> {
    return this.rmqPublisher.request('order.getMyOrders.query', {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiOkResponse({ description: 'Order details' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrder(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rmqPublisher.request('order.get', id);
  }

  @Patch('status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update order status' })
  @ApiNoContentResponse({ description: 'Order status updated successfully' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto): Promise<any> {
    return this.rmqPublisher.request('order.updateStatus', updateOrderStatusDto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiAcceptedResponse({ description: 'Order cancelled successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  cancelOrder(@Body() cancelOrderDto: CancelOrderDto): Promise<any> {
    return this.rmqPublisher.request('order.cancel', cancelOrderDto);
  }
}
