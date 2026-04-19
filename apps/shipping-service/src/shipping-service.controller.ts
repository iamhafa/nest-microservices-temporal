import { UpdateDeliveryStatusDto } from '@libs/contract/shipping/dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ShippingEntity } from './entity/shipping.entity';
import { ShippingService } from './shipping-service.service';

@Controller()
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @MessagePattern({ cmd: 'get-shippings' })
  getShippings(): Promise<ShippingEntity[]> {
    return this.shippingService.getShippings();
  }

  @MessagePattern({ cmd: 'update-delivery-status' })
  updateDeliveryStatus(updateDeliveryStatusDto: UpdateDeliveryStatusDto): Promise<ShippingEntity> {
    return this.shippingService.updateDeliveryStatus(updateDeliveryStatusDto);
  }
}
