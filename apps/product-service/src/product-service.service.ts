import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';
import { Injectable } from '@nestjs/common';
import { ProductEntity } from './entity/product.entity';
import { ProductRepository } from './repository/product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  createProduct(createProductRequestDto: CreateProductRequestDto): Promise<ProductEntity> {
    const product: ProductEntity = this.productRepository.create(createProductRequestDto);
    return this.productRepository.save(product);
  }

  getProducts(): Promise<ProductEntity[]> {
    return this.productRepository.findBy({ is_active: true });
  }
}
