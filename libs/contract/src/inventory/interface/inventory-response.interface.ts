export interface IInventoryResponseDto {
  id: number;
  product_id: number;
  stock: number;
  reserved_quantity: number;
  warehouse_location?: string;
}
