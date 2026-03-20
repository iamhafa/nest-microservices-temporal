import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';

export interface IProductActivity {
  validateProducts(productIds: number[]): Promise<boolean>;
  createProduct(dto: CreateProductDto): Promise<number>;
  deleteProduct(productId: number): Promise<void>;
}
