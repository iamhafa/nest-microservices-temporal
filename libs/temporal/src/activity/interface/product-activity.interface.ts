import { ProductValidationResult } from '@libs/contract/product/dto/product-info.dto';

export interface IProductActivity {
  validateProducts(productIds: number[]): Promise<ProductValidationResult>;
}
