import { InventoryRoutingKey, RmqPublisherService } from '@libs/messaging';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdjustInventoryDto, AvailableStockResponseDto, InventoryResponseDto } from './dto';

@ApiBearerAuth('Authorization')
@ApiTags('Inventory')
@Controller('inventories')
export class InventoryController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Patch('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust product inventory stock safely' })
  @ApiOkResponse({ description: 'Inventory adjusted successfully', type: InventoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  adjustInventory(@Body() adjustInventoryDto: AdjustInventoryDto): Promise<InventoryResponseDto> {
    return this.rmqPublisher.request<InventoryResponseDto>(InventoryRoutingKey.ADJUST, adjustInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventories' })
  @ApiOkResponse({ description: 'List of inventories', type: [InventoryResponseDto] })
  getInventories(): Promise<InventoryResponseDto[]> {
    return this.rmqPublisher.request<InventoryResponseDto[]>(InventoryRoutingKey.GET_ALL, {});
  }

  @Get('products/:productId/available-stock')
  @ApiOperation({ summary: 'Get available stock for a product' })
  @ApiOkResponse({ description: 'Available stock details', type: AvailableStockResponseDto })
  getAvailableStock(@Param('productId', ParseIntPipe) productId: number): Promise<AvailableStockResponseDto> {
    return this.rmqPublisher.request<AvailableStockResponseDto>(InventoryRoutingKey.GET_AVAILABLE_STOCK, productId);
  }
}
