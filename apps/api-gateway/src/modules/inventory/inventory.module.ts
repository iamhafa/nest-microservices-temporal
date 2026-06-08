import { SharedRabbitMQModule } from '@libs/common';
import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [InventoryController],
})
export class InventoryModule {}
