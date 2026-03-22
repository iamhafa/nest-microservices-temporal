import { CancelOrderDto } from '@libs/contract/order/dto/cancel-order-request.dto';
import { CreateOrderDto } from '@libs/contract/order/dto/create-order.dto';
import { UpdateOrderStatusDto } from '@libs/contract/order/dto/update-order-status.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderEntity } from './entity/order.entity';
import { OrderService } from './order-service.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create-order' })
  createOrder(@Payload() createOrderDto: CreateOrderDto): Promise<any> {
    return this.orderService.createOrder(createOrderDto);
  }

  @MessagePattern({ cmd: 'get-order' })
  getOrder(@Payload() orderId: number): Promise<OrderEntity> {
    return this.orderService.getOrder(orderId);
  }

  @MessagePattern({ cmd: 'cancel-order' })
  cancelOrder(@Payload() cancelOrderDto: CancelOrderDto): Promise<any> {
    return this.orderService.cancelOrder(cancelOrderDto);
  }

  @MessagePattern({ cmd: 'get-orders' })
  getOrders(): Promise<OrderEntity[]> {
    return this.orderService.getOrders();
  }

  @MessagePattern({ cmd: 'update-order-status' })
  updateOrderStatus(@Payload() updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
    return this.orderService.updateOrderStatus(updateOrderStatusDto);
  }
}
