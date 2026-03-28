import { DeliveryStatus } from '@libs/contract/shipping/enum/delivery-status.enum';
import { IShippingActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { ShippingEntity } from '../entity/shipping.entity';
import { ShippingRepository } from '../repository/shipping.repository';

@Activity({ name: 'shipping-activities' })
export class ShippingActivities implements IShippingActivity {
  private readonly logger = new Logger(ShippingActivities.name);

  constructor(private readonly shippingRepository: ShippingRepository) {}

  @ActivityMethod()
  async createShipment(orderId: number, address: string): Promise<number> {
    this.logger.log(`[Order ${orderId}] Creating internal shipping record to: ${address}`);

    const newShipping = this.shippingRepository.create({
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
