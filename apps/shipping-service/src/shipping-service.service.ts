import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RmqExchange, RmqQueue, ShippingRoutingKey } from '@libs/messaging';
import { type IUpdateDeliveryStatusDto, ShippingErrorCode } from '@libs/contract/shipping';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ShippingEntity } from './entity/shipping.entity';
import { ShippingRepository } from './repository/shipping.repository';

@Injectable()
export class ShippingService {
  constructor(private readonly shippingRepository: ShippingRepository) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ShippingRoutingKey.GET_ALL,
    queue: RmqQueue.SHIPPING_QUEUE,
  })
  getShippings(): Promise<ShippingEntity[]> {
    return this.shippingRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ShippingRoutingKey.UPDATE_STATUS,
    queue: RmqQueue.SHIPPING_QUEUE,
  })
  async updateDeliveryStatus(@RabbitPayload() updateDeliveryStatusDto: IUpdateDeliveryStatusDto): Promise<ShippingEntity> {
    const { id, status } = updateDeliveryStatusDto;
    const shipping = await this.shippingRepository.findOneBy({ id });
    if (!shipping) {
      throw new NotFoundException(`Shipping not found with id: ${id}`, {
        errorCode: ShippingErrorCode.NOT_FOUND,
      });
    }
    shipping.status = status;
    return this.shippingRepository.save(shipping);
  }
}
