import { UpdateDeliveryStatusDto } from '@libs/contract/shipping/dto/update-delivery-status.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ShippingEntity } from './entity/shipping.entity';
import { ShippingRepository } from './repository/shipping.repository';

@Injectable()
export class ShippingService {
  constructor(private readonly shippingRepository: ShippingRepository) {}

  getShippings(): Promise<ShippingEntity[]> {
    return this.shippingRepository.find();
  }

  async updateDeliveryStatus(updateDeliveryStatusDto: UpdateDeliveryStatusDto): Promise<ShippingEntity> {
    const { id, status } = updateDeliveryStatusDto;
    const shipping = await this.shippingRepository.findOneBy({ id });
    if (!shipping) {
      throw new RpcException(`Shipping not found with id: ${id}`);
    }
    shipping.status = status;
    return this.shippingRepository.save(shipping);
  }
}
