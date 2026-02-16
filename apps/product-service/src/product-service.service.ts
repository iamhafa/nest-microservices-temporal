import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';
import { CreateProductResponseDto } from '@libs/contract/product/dto/create-product-response.dto';
import { Injectable } from '@nestjs/common';
import { ProductEntity } from './entity/product.entity';
import { ProductRepository } from './repository/product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(dto: CreateProductRequestDto): Promise<CreateProductResponseDto> {
    const product: ProductEntity = this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      image_url: dto.image_url,
    });
    await this.productRepository.save(product);

    return {
      product_id: product.id,
      name: product.name,
      message: 'Product created successfully',
    };
  }

  async getProducts(): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: { is_active: true },
    });
  }
}
