import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [],
  controllers: [ShippingController],
})
export class ShippingModule {}
