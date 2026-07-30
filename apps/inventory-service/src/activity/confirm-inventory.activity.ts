import { AppException } from '@libs/common';
import { InventoryErrorCode } from '@libs/contract/inventory';
import { IOrderItem } from '@libs/contract/order';
import { IConfirmInventoryActivity } from '@libs/temporal';
import { HttpStatus, Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';

@Activity({ name: 'confirm-inventory-activity' })
export class ConfirmInventoryActivity implements IConfirmInventoryActivity {
  private readonly logger = new Logger(ConfirmInventoryActivity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod({ name: 'confirmInventory' })
  execute(orderId: number, orderItems: IOrderItem[]): Promise<void> {
    this.logger.log(`[Order ${orderId}] Confirming inventory deduction.`);

    return this.entityManager.transaction(async (manager: EntityManager) => {
      for (const orderItem of orderItems) {
        const result = await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            stock: () => `stock - :quantity`,
            reserved_quantity: () => `reserved_quantity - :quantity`,
          })
          .setParameter('quantity', orderItem.quantity)
          .where('product_id = :productId', { productId: orderItem.product_id })
          .andWhere('reserved_quantity >= :quantity', { quantity: orderItem.quantity })
          .execute();

        if (result.affected === 0) {
          throw new AppException({
            code: InventoryErrorCode.ADJUSTMENT_FAILED,
            message: `Inventory reconciliation error for product ${orderItem.product_id}`,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
          });
        }
      }
    });
  }
}
