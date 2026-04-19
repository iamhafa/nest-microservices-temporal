import { CancelOrderDto, CreateOrderDto, UpdateOrderStatusDto } from '@libs/contract/order/dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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
import { Observable } from 'rxjs';

@ApiBearerAuth('Authorization')
@ApiTags('Order')
@Controller('orders')
export class OrderController {
  constructor(@Inject('ORDER_SERVICE_CLIENT') private readonly orderServiceClient: ClientProxy) {}

  @Post('place')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Place an order' })
  @ApiAcceptedResponse({ description: 'Order is processing' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createOrder(@Body() createOrderDto: CreateOrderDto): Observable<any> {
    return this.orderServiceClient.send({ cmd: 'create-order' }, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'List of orders' })
  getOrders(): Observable<any> {
    return this.orderServiceClient.send({ cmd: 'get-orders' }, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiOkResponse({ description: 'Order details' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrder(@Param('id', ParseIntPipe) id: number): Observable<any> {
    return this.orderServiceClient.send({ cmd: 'get-order' }, id);
  }

  @Patch('status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update order status' })
  @ApiNoContentResponse({ description: 'Order status updated successfully' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto): Observable<any> {
    return this.orderServiceClient.send({ cmd: 'update-order-status' }, updateOrderStatusDto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiAcceptedResponse({ description: 'Order cancelled successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  cancelOrder(@Body() cancelOrderDto: CancelOrderDto): Observable<any> {
    return this.orderServiceClient.send({ cmd: 'cancel-order' }, cancelOrderDto);
  }
}
