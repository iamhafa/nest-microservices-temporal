import { IRestoreInventory } from '@libs/temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager, UpdateResult } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';
import { Logger } from '@nestjs/common';
import { OrderItemDto } from '@libs/contract/order/dto';
import { InventoryErrorCode } from '@libs/contract/inventory/error';
import { AppException } from '@libs/common/exception/app-exception';

@Activity({ name: 'restore-inventory-activity' })
export class RestoreInventoryActivity implements IRestoreInventory {
  private readonly logger = new Logger(RestoreInventoryActivity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod({ name: 'restoreInventory' })
  execute(orderId: number, orderItems: OrderItemDto[]): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Restoring inventory (Cancel Order):`, orderItems);

    return this.entityManager.transaction(async (manager: EntityManager) => {
      for (const orderItem of orderItems) {
        const result: UpdateResult = await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            stock: () => `stock + :quantity`,
          })
          .setParameter('quantity', orderItem.quantity)
          .where('product_id = :productId', { productId: orderItem.product_id })
          .execute();

        if (result.affected === 0) {
          throw new AppException({
            code: InventoryErrorCode.RESTORE_FAILED,
            message: `Restore inventory failed for order ${orderId} and product ${orderItem.product_id}`,
          });
        }
      }
    });
  }
}
