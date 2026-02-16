import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order-service.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create-order' })
  createOrder(@Payload() createOrderDto: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
    return this.orderService.createOrder(createOrderDto);
  }
}
