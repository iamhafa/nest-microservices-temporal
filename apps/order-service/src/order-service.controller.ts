import { CreateOrderDto } from '@contract/order';
import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from './order-service.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }
}
