import { CreateOrderRequestDto, CreateOrderResponseDto } from '@contract/order';
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
