// Tạo đơn vận chuyển
export interface ICreateShipment {
  execute(orderId: number, address: string): Promise<number>;
}
