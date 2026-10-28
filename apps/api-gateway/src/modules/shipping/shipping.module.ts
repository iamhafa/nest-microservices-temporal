import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller.js';

@Module({
  imports: [],
  controllers: [ShippingController],
})
export class ShippingModule {}
