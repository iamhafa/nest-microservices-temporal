import { CancelOrderRequestDto } from '@libs/contract/order/dto/cancel-order-request.dto';
import { CancelOrderResponseDto } from '@libs/contract/order/dto/cancel-order-response.dto';
import { CreateOrderRequestDto } from '@libs/contract/order/dto/create-order-request.dto';
import { CreateOrderResponseDto } from '@libs/contract/order/dto/create-order-response.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderEntity } from './entity/order.entity';
import { OrderService } from './order-service.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create-order' })
  createOrder(@Payload() createOrderDto: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
    return this.orderService.createOrder(createOrderDto);
  }

  @MessagePattern({ cmd: 'get-order' })
  getOrder(@Payload() orderId: number): Promise<OrderEntity> {
    return this.orderService.getOrder(orderId);
  }

  @MessagePattern({ cmd: 'cancel-order' })
  cancelOrder(@Payload() cancelOrderDto: CancelOrderRequestDto): Promise<CancelOrderResponseDto> {
    return this.orderService.cancelOrder(cancelOrderDto);
  }
}
