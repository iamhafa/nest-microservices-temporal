import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [],
  controllers: [InventoryController],
})
export class InventoryModule {}
