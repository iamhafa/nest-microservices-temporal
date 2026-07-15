import { AppException } from '@libs/common';
import { InventoryErrorCode } from '@libs/contract/inventory';
import { IOrderItem } from '@libs/contract/order';
import { IReserveInventoryActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager, UpdateResult } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';

@Activity({ name: 'reserve-inventory-activity' })
export class ReserveInventoryActity implements IReserveInventoryActivity {
  private readonly logger = new Logger(ReserveInventoryActity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod({ name: 'reserveInventory' })
  execute(orderId: number, orderItems: IOrderItem[]): Promise<void> {
    this.logger.log(`[Order ${orderId}] Reserving inventory: `, orderItems);

    return this.entityManager.transaction(async (manager: EntityManager) => {
      for (const orderItem of orderItems) {
        const result: UpdateResult = await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            reserved_quantity: () => `reserved_quantity + :quantity`,
          })
          .setParameter('quantity', orderItem.quantity)
          .where('product_id = :productId', { productId: orderItem.product_id })
          // Kiểm tra tồn kho thực tế: stock - reserved >= quantity
          .andWhere('stock - reserved_quantity >= :quantity', { quantity: orderItem.quantity })
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
