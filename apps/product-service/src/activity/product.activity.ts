import { ProductValidationResult } from '@libs/contract/product/dto/product-info.dto';
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
  async validateProducts(productIds: number[]): Promise<ProductValidationResult> {
    this.logger.log(`Validating products: ${productIds.join(', ')}`);

    const products: ProductEntity[] = await this.productRepository.find({
      where: {
        id: In(productIds),
        is_active: true,
      },
    });

    const foundIds = products.map(p => p.id);
    const missingIds = productIds.filter(id => !foundIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.warn(`Products not found or inactive: ${missingIds.join(', ')}`);
      return { valid: false, products: [] };
    }

    this.logger.log(`All ${productIds.length} products validated successfully`);
    return {
      valid: true,
      products: products.map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price,
      })),
    };
  }
}
