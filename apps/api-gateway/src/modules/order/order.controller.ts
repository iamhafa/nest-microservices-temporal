import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
