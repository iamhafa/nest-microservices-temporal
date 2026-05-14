import { AppException } from '@libs/common/exception/app-exception';
import { UpdateDeliveryStatusDto } from '@libs/contract/shipping/dto';
import { ShippingErrorCode } from '@libs/contract/shipping/error';
import { HttpStatus, Injectable } from '@nestjs/common';
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
      throw new AppException({
        code: ShippingErrorCode.NOT_FOUND,
        message: `Shipping not found with id: ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    shipping.status = status;
    return this.shippingRepository.save(shipping);
  }
}
