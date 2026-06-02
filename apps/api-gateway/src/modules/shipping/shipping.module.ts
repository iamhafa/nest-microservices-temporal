import { SharedRabbitMQModule } from '@libs/common/rabbitmq';
import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [ShippingController],
})
export class ShippingModule {}
