import { CancelOrderRequestDto } from '@libs/contract/order/dto/cancel-order-request.dto';
import { CancelOrderResponseDto } from '@libs/contract/order/dto/cancel-order-response.dto';
import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Order')
@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE_CLIENT')
    private readonly orderServiceClient: ClientProxy,
  ) {}

  @Post('place')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Place an order' })
  @ApiAcceptedResponse({ type: CreateOrderResponseDto, description: 'Order is processing' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createOrder(@Body() createOrderDto: CreateOrderRequestDto): Observable<CreateOrderResponseDto> {
    return this.orderServiceClient.send({ cmd: 'create-order' }, createOrderDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiOkResponse({ description: 'Order details' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrder(@Param('id', ParseIntPipe) id: number): Observable<any> {
    return this.orderServiceClient.send({ cmd: 'get-order' }, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiOkResponse({ type: CancelOrderResponseDto, description: 'Order cancelled successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelOrderDto: CancelOrderRequestDto,
  ): Observable<CancelOrderResponseDto> {
    cancelOrderDto.order_id = id;
    return this.orderServiceClient.send({ cmd: 'cancel-order' }, cancelOrderDto);
  }
}
