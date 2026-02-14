import { CreateOrderDto } from '@contract/order';
import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from './order-service.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    console.log('Order Service: Received create order request', createOrderDto);
    return this.orderService.createOrder(createOrderDto);
  }
}
