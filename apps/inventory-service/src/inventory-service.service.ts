import { AppException } from '@libs/common/exception/app-exception';
import { AdjustInventoryDto } from '@libs/contract/inventory/dto';
import { InventoryErrorCode } from '@libs/contract/inventory/error';
import { Injectable, Logger } from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryRepository } from './repository/inventory.repository';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async adjustInventory(adjustInventoryDto: AdjustInventoryDto): Promise<InventoryEntity> {
    this.logger.log(`Adjusting inventory for product ${adjustInventoryDto.product_id}`);
    const { product_id, quantity_change } = adjustInventoryDto;

    const result: UpdateResult = await this.inventoryRepository
      .createQueryBuilder()
      .update(InventoryEntity)
      .set({
        stock: () => `stock + :quantityChange`,
      })
      .setParameter('quantityChange', quantity_change)
      .where('product_id = :productId', { productId: product_id })
      .andWhere('stock + :quantityChange >= 0', { quantityChange: quantity_change })
      .execute();

    if (result.affected === 0) {
      throw new AppException({
        code: InventoryErrorCode.ADJUSTMENT_FAILED,
        message: `Cannot adjust stock for product ${product_id}. It may not exist or the adjustment results in negative stock.`,
      });
    } else {
      return this.inventoryRepository.findOneByOrFail({ product_id });
    }
  }
}
