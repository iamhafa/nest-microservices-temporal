import { AdjustInventoryDto } from '@libs/contract/inventory/dto/adjust-inventory.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryService } from './inventory-service.service';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'adjust-inventory' })
  adjustInventory(@Payload() adjustInventoryDto: AdjustInventoryDto): Promise<InventoryEntity> {
    return this.inventoryService.adjustInventory(adjustInventoryDto);
  }
}
