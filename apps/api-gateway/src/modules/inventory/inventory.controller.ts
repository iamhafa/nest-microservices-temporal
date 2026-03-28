import { AdjustInventoryDto } from '@libs/contract/inventory/dto/adjust-inventory.dto';
import { Body, Controller, HttpCode, HttpStatus, Inject, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBadRequestResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(@Inject('INVENTORY_SERVICE_CLIENT') private readonly inventoryServiceClient: ClientProxy) {}

  @Patch('adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Adjust product inventory stock safely' })
  @ApiNoContentResponse({ description: 'Inventory adjustment requested' })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  adjustInventory(@Body() adjustInventoryDto: AdjustInventoryDto): Observable<void> {
    return this.inventoryServiceClient.send({ cmd: 'adjust-inventory' }, adjustInventoryDto);
  }
}
