export interface IOrderActivity {
  cancelOrder(orderId: number): Promise<void>;
}
