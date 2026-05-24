import { IDeleteProduct } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { ProductRepository } from '../modules/product/repository/product.repository';

@Activity({ name: 'delete-product-activity' })
export class DeleteProductActivity implements IDeleteProduct {
  private readonly logger = new Logger(DeleteProductActivity.name);

  constructor(private readonly productRepository: ProductRepository) {}

  @ActivityMethod({ name: 'deleteProduct' })
  async execute(productId: number): Promise<void> {
    this.logger.warn(`Compensating: Deleting product ${productId}`);
    await this.productRepository.softDelete(productId);
  }
}
