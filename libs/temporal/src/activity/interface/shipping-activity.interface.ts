export interface IShippingActivity {
  createShipment(orderId: string, address: string): Promise<string>;
}
