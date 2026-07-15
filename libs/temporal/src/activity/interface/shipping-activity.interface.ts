// Tạo đơn vận chuyển
export interface ICreateShipmentActivity {
  execute(orderId: number, address: string): Promise<number>;
}
