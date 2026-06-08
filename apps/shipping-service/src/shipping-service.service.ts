import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { AppException, RmqExchange, RmqQueue } from '@libs/common';
import { UpdateDeliveryStatusDto } from '@libs/contract/shipping/dto/update-delivery-status.dto';
import { ShippingErrorCode } from '@libs/contract/shipping/error';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ShippingEntity } from './entity/shipping.entity';
import { ShippingRepository } from './repository/shipping.repository';

@Injectable()
export class ShippingService {
  constructor(private readonly shippingRepository: ShippingRepository) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'shipping.getAll',
    queue: RmqQueue.SHIPPING_QUEUE,
  })
  getShippings(): Promise<ShippingEntity[]> {
    return this.shippingRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'shipping.updateStatus',
    queue: RmqQueue.SHIPPING_QUEUE,
  })
  async updateDeliveryStatus(
    @RabbitPayload() updateDeliveryStatusDto: UpdateDeliveryStatusDto,
  ): Promise<ShippingEntity> {
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
