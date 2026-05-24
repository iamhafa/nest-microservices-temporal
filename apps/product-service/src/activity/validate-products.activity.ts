import { IValidateProducts } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { In } from 'typeorm';
import { ProductEntity } from '../modules/product/entity/product.entity';
import { ProductRepository } from '../modules/product/repository/product.repository';

@Activity({ name: 'validate-products-activity' })
export class ValidateProductsActivity implements IValidateProducts {
  private readonly logger = new Logger(ValidateProductsActivity.name);

  constructor(private readonly productRepository: ProductRepository) {}

  @ActivityMethod({ name: 'validateProducts' })
  async execute(productIds: number[]): Promise<boolean> {
    this.logger.log(`Validating products: ${productIds.join(', ')}`);

    const products: ProductEntity[] = await this.productRepository.find({
      where: {
        id: In(productIds),
        is_active: true,
      },
    });

    const foundIds = new Set(products.map(product => product.id));
    const missingIds: number[] = productIds.filter(productId => !foundIds.has(productId));

    if (missingIds.length > 0) {
      this.logger.warn(`Products not found or inactive: ${missingIds.join(', ')}`);
      return false;
    }

    this.logger.log(`All ${productIds.length} products validated successfully`);
    return true;
  }
}
