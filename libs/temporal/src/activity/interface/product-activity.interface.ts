export interface IProductActivity {
  validateProducts(productIds: number[]): Promise<boolean>;
}
