import { IGetProductPricesActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { In } from 'typeorm';
import { ProductEntity } from '../modules/product/entity/product.entity';
import { ProductRepository } from '../modules/product/repository/product.repository';

@Activity({ name: 'get-product-prices-activity' })
export class GetProductPricesActivity implements IGetProductPricesActivity {
  private readonly logger = new Logger(GetProductPricesActivity.name);

  constructor(private readonly productRepository: ProductRepository) {}

  @ActivityMethod({ name: 'getProductPrices' })
  async execute(productIds: number[]): Promise<Record<number, number>> {
    this.logger.log(`Fetching prices for products: ${productIds.join(', ')}`);

    const products: ProductEntity[] = await this.productRepository.find({
      where: { id: In(productIds), is_active: true },
      select: { id: true, price: true },
    });

    const productPrices: Record<number, number> = {};
    for (const product of products) {
      productPrices[product.id] = product.price;
    }

    return productPrices;
  }
}
