import { AppException } from '@libs/common';
import { ProductErrorCode } from '@libs/contract/product';
import { IDeleteProductActivity } from '@libs/temporal';
import { HttpStatus, Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { ProductRepository } from '../modules/product/repository/product.repository';

@Activity({ name: 'delete-product-activity' })
export class DeleteProductActivity implements IDeleteProductActivity {
  private readonly logger = new Logger(DeleteProductActivity.name);

  constructor(private readonly productRepository: ProductRepository) {}

  @ActivityMethod({ name: 'deleteProduct' })
  async execute(productId: number): Promise<void> {
    this.logger.warn(`Compensating: Deleting product ${productId}`);
    const result = await this.productRepository.softDelete(productId);

    if (result.affected === 0) {
      this.logger.error(`[Product ${productId}] Failed to delete product`);

      throw new AppException({
        code: ProductErrorCode.DELETE_PRODUCT_FAILED,
        status: HttpStatus.BAD_REQUEST,
        message: `Delete product ${productId} failed`,
      });
    }

    this.logger.log(`[Product ${productId}] Deleted product`);
  }
}
