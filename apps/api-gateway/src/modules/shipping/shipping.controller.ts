import { RmqPublisherService, ShippingRoutingKey } from '@libs/messaging';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingResponseDto, UpdateDeliveryStatusDto } from './dto';

@ApiBearerAuth('Authorization')
@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Get()
  @ApiOperation({ summary: 'Get all shippings' })
  @ApiOkResponse({ description: 'List of shippings', type: [ShippingResponseDto] })
  getShippings(): Promise<ShippingResponseDto[]> {
    return this.rmqPublisher.request<ShippingResponseDto[]>(ShippingRoutingKey.GET_ALL, {});
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiOkResponse({ description: 'Delivery status updated', type: ShippingResponseDto })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  updateDeliveryStatus(@Body() updateDeliveryStatusDto: UpdateDeliveryStatusDto): Promise<ShippingResponseDto> {
    return this.rmqPublisher.request<ShippingResponseDto>(ShippingRoutingKey.UPDATE_STATUS, updateDeliveryStatusDto);
  }
}
