export interface IShippingActivity {
  createShipment(orderId: number, address: string): Promise<string>;
}
