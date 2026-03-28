export interface IShippingActivity {
  /**
   * Tạo vận đơn
   */
  createShipment(orderId: number, address: string): Promise<number>;
}
