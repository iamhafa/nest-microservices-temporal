export interface IAdjustInventoryDto {
  product_id: number;
  quantity_change: number;
  reason?: string;
}
