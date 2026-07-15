export interface IOrderItem {
  product_id: number;
  quantity: number;
}

export interface ICreateOrderDto {
  items: IOrderItem[];
  address: string;
  email: string;
}
