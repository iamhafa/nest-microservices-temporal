import { SharedRabbitMQModule } from '@libs/messaging';
import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [ShippingController],
})
export class ShippingModule {}
