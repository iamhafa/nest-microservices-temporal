import { AdjustInventoryDto } from '@libs/contract/inventory/dto';
import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { RmqPublisherService } from '@libs/common/rabbitmq';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Patch('adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Adjust product inventory stock safely' })
  @ApiNoContentResponse({ description: 'Inventory adjustment requested' })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  adjustInventory(@Body() adjustInventoryDto: AdjustInventoryDto): Promise<void> {
    return this.rmqPublisher.request('inventory.adjust', adjustInventoryDto);
  }
}
