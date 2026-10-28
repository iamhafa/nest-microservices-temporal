import { DeliveryStatus } from '@libs/contract/shipping';
import { ICreateShipmentActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { ShippingEntity } from '../entity/shipping.entity.js';
import { ShippingRepository } from '../repository/shipping.repository.js';

@Activity({ name: 'create-shipment-activity' })
export class CreateShipmentActivity implements ICreateShipmentActivity {
  private readonly logger = new Logger(CreateShipmentActivity.name);

  constructor(private readonly shippingRepository: ShippingRepository) {}

  @ActivityMethod({ name: 'createShipment' })
  async execute(orderId: number, address: string): Promise<number> {
    this.logger.log(`[Order ${orderId}] Creating internal shipping record to: ${address}`);

    const newShipping: ShippingEntity = this.shippingRepository.create({
      order_id: orderId,
      address,
      status: DeliveryStatus.PENDING,
      tracking_code: `TRK-${Date.now()}`,
    });
    const shipping: ShippingEntity = await this.shippingRepository.save(newShipping);

    this.logger.log(`[Order ${orderId}] Shipping record created successfully. ID: ${shipping.id}`);
    return shipping.id;
  }
}
