import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';

export interface IProductActivity {
  validateProducts(productIds: number[]): Promise<boolean>;
  createProduct(dto: CreateProductRequestDto): Promise<number>;
  deleteProduct(productId: number): Promise<void>;
}
