import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [],
  controllers: [InventoryController],
})
export class InventoryModule {}
