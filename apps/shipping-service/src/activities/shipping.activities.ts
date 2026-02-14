import { IShippingActivity } from '@temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity({ name: 'shipping-activities' })
export class ShippingActivities implements IShippingActivity {
  @ActivityMethod()
  async createShipment(orderId: number, address: string): Promise<string> {
    void orderId;
    void address;
    return `shipment_${orderId}_${Date.now()}`;
  }
}
