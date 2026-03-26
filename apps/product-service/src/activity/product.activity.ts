import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { IProductActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { In } from 'typeorm';
import { ProductEntity } from '../entity/product.entity';
import { ProductRepository } from '../repository/product.repository';

@Activity({ name: 'product-activity' })
export class ProductActivity implements IProductActivity {
  private readonly logger = new Logger(ProductActivity.name);

  constructor(private readonly productRepository: ProductRepository) {}

  @ActivityMethod()
  async validateProducts(productIds: number[]): Promise<boolean> {
    this.logger.log(`Validating products: ${productIds.join(', ')}`);

    const products: ProductEntity[] = await this.productRepository.find({
      where: {
        id: In(productIds),
        is_active: true,
      },
    });

    const foundIds: number[] = products.map(product => product.id);
    const missingIds: number[] = productIds.filter(productId => !foundIds.includes(productId));

    if (missingIds.length > 0) {
      this.logger.warn(`Products not found or inactive: ${missingIds.join(', ')}`);
      return false;
    }

    this.logger.log(`All ${productIds.length} products validated successfully`);

    return true;
  }

  @ActivityMethod()
  async createProduct(createProductDto: Omit<CreateProductDto, 'quantity'>): Promise<number> {
    this.logger.log(`Creating product: ${createProductDto.name}`);
    const product: ProductEntity = this.productRepository.create(createProductDto);
    const savedProduct: ProductEntity = await this.productRepository.save(product);
    return savedProduct.id;
  }

  @ActivityMethod()
  async deleteProduct(productId: number): Promise<void> {
    this.logger.warn(`Compensating: Deleting product ${productId}`);
    await this.productRepository.softDelete(productId);
  }

  @ActivityMethod()
  async getProductPrices(productIds: number[]): Promise<Record<number, number>> {
    this.logger.log(`Fetching prices for products: ${productIds.join(', ')}`);
    const products: ProductEntity[] = await this.productRepository.find({
      where: { id: In(productIds), is_active: true },
      select: { id: true, price: true },
    });

    // Convert array to map
    const productPrices: Record<number, number> = {};
    for (const product of products) {
      productPrices[product.id] = product.price; // key is product id, value is product price
    }

    return productPrices;
  }
}
