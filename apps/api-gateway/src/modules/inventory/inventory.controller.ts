import { RmqPublisherService } from '@libs/messaging';
import { AdjustInventoryDto } from './dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Inventory')
@Controller('inventories')
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

  @Get()
  @ApiOperation({ summary: 'Get all inventories' })
  @ApiOkResponse({ description: 'List of inventories' })
  getInventories(): Promise<any[]> {
    return this.rmqPublisher.request('inventory.getAll', {});
  }

  @Get('products/:productId/available-stock')
  @ApiOperation({ summary: 'Get available stock for a product' })
  @ApiOkResponse({ description: 'Available stock details' })
  getAvailableStock(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<{ productId: number; availableQuantity: number }> {
    return this.rmqPublisher.request('inventory.getAvailableStock.query', productId);
  }
}
