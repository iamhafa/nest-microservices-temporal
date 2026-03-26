import { OrderItemDto } from '@libs/contract/order/dto/create-order.dto';
import { IInventoryActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager, UpdateResult } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';

@Activity({ name: 'inventory-activity' })
export class InventoryActivity implements IInventoryActivity {
  private readonly logger = new Logger(InventoryActivity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod()
  reserveInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void> {
    this.logger.log(`[Order ${orderId}] Reserving inventory...`);

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
          throw new Error(`Product ${orderItem.product_id} out of stock.`);
        }
      }
    });
  }

  @ActivityMethod()
  releaseInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Đang nhả kho (Rollback)...`);

    return this.entityManager.transaction(async (manager: EntityManager) => {
      for (const orderItem of orderItems) {
        await manager
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
      }
    });
  }

  /**
   * Bước này cực kỳ quan trọng: Gọi khi Thanh toán thành công.
   * Nó sẽ trừ hẳn vào Stock và giải phóng Reserved.
   */
  @ActivityMethod()
  confirmInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void> {
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
          throw new Error(`Inventory reconciliation error for product ${orderItem.product_id}`);
        }
      }
    });
  }

  /**
   * Khôi phục tồn kho khi hủy đơn hàng đã hoàn tất.
   * Cộng lại stock cho các sản phẩm đã bị trừ.
   */
  @ActivityMethod()
  restoreInventory(orderId: number, orderItems: OrderItemDto[]): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Restoring inventory (Cancel Order)...`);

    return this.entityManager.transaction(async (manager: EntityManager) => {
      for (const orderItem of orderItems) {
        await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            stock: () => `stock + :quantity`,
          })
          .setParameter('quantity', orderItem.quantity)
          .where('product_id = :productId', { productId: orderItem.product_id })
          .execute();
      }
    });
  }

  @ActivityMethod()
  async initializeInventory(productId: number, quantity: number): Promise<void> {
    this.logger.log(`Initializing inventory for product ${productId} with quantity ${quantity}`);
    const inventory = this.entityManager.create(InventoryEntity, {
      product_id: productId,
      stock: quantity,
      reserved_quantity: 0,
    });
    await this.entityManager.save(inventory);
  }
}
