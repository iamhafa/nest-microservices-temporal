import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
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
  @ApiOperation({ summary: 'Place an order' })
  @ApiCreatedResponse({ type: CreateOrderResponseDto, description: 'Order placed successfully' })
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
}
