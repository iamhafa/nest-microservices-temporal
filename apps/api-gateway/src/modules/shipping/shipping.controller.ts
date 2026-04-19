import { UpdateDeliveryStatusDto } from '@libs/contract/shipping/dto';
import { Body, Controller, Get, Inject, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiBearerAuth('Authorization')
@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(@Inject('SHIPPING_SERVICE_CLIENT') private readonly shippingServiceClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'Get all shippings' })
  @ApiOkResponse({ description: 'List of shippings' })
  getShippings(): Observable<any[]> {
    return this.shippingServiceClient.send({ cmd: 'get-shippings' }, {});
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiOkResponse({ description: 'Delivery status updated' })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  updateDeliveryStatus(@Body() updateDeliveryStatusDto: UpdateDeliveryStatusDto): Observable<any> {
    return this.shippingServiceClient.send({ cmd: 'update-delivery-status' }, updateDeliveryStatusDto);
  }
}
