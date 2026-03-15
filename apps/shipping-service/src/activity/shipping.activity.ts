import { IShippingActivity } from '@libs/temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity({ name: 'shipping-activities' })
export class ShippingActivities implements IShippingActivity {
  @ActivityMethod()
  async createShipment(orderId: number, address: string): Promise<string> {
    return `shipment_${orderId}_${Date.now()}`;
  }
}
