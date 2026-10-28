import { Module } from '@nestjs/common';
import { OrderController } from './order.controller.js';

@Module({
  imports: [],
  controllers: [OrderController],
})
export class OrderModule {}
