import { SharedRabbitMQModule } from '@libs/common/rabbitmq';
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [OrderController],
})
export class OrderModule {}
