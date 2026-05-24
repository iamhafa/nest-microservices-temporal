import { IReleaseInventory } from '@libs/temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager, UpdateResult } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';
import { AppException } from '@libs/common/exception/app-exception';
import { InventoryErrorCode } from '@libs/contract/inventory/error';
import { Logger } from '@nestjs/common';
import { OrderItemDto } from '@libs/contract/order/dto';

@Activity({ name: 'release-inventory-activity' })
export class ReleaseInventoryActivity implements IReleaseInventory {
  private readonly logger = new Logger(ReleaseInventoryActivity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod({ name: 'releaseInventory' })
  execute(orderId: number, orderItems: OrderItemDto[]): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Đang nhả kho (Rollback):`, orderItems);

    return this.entityManager.transaction(async (manager: EntityManager) => {
      for (const orderItem of orderItems) {
        const result: UpdateResult = await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            reserved_quantity: () => `reserved_quantity - :quantity`,
          })
          .setParameter('quantity', orderItem.quantity)
          .where('product_id = :productId', { productId: orderItem.product_id })
          // Idempotency: Đảm bảo không trừ xuống âm
          .andWhere('reserved_quantity >= :quantity', { quantity: orderItem.quantity })
          .execute();

        if (result.affected === 0) {
          throw new AppException({
            code: InventoryErrorCode.ADJUSTMENT_FAILED,
            message: `Product ${orderItem.product_id} out of stock.`,
          });
        }
      }
    });
  }
}
