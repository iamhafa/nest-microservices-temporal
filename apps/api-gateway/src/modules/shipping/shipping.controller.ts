import { RmqPublisherService, ShippingRoutingKey } from '@libs/messaging';
import { UpdateDeliveryStatusDto } from './dto';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Get()
  @ApiOperation({ summary: 'Get all shippings' })
  @ApiOkResponse({ description: 'List of shippings' })
  getShippings(): Promise<any[]> {
    return this.rmqPublisher.request(ShippingRoutingKey.GET_ALL, {});
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiOkResponse({ description: 'Delivery status updated' })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  updateDeliveryStatus(@Body() updateDeliveryStatusDto: UpdateDeliveryStatusDto): Promise<any> {
    return this.rmqPublisher.request(ShippingRoutingKey.UPDATE_STATUS, updateDeliveryStatusDto);
  }
}
