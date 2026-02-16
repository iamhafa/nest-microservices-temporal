import { OrderItemDto } from '@libs/contract/order/dto/create-order-request.dto';
import { IInventoryActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { DataSource, EntityManager, UpdateResult } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';

@Activity({ name: 'inventory-activity' })
export class InventoryActivity implements IInventoryActivity {
  private readonly logger = new Logger(InventoryActivity.name);

  constructor(private readonly dataSource: DataSource) {}

  @ActivityMethod()
  reserveInventory(orderId: number, items: OrderItemDto[]): Promise<void> {
    this.logger.log(`[Order ${orderId}] Đang giữ kho tạm thời...`);

    return this.dataSource.transaction(async (manager: EntityManager) => {
      for (const item of items) {
        const result: UpdateResult = await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            reserved_quantity: () => `reserved_quantity + ${item.quantity}`,
          })
          .where('product_id = :productId', { productId: item.product_id })
          // Kiểm tra tồn kho thực tế: stock - reserved >= quantity
          .andWhere('stock - reserved_quantity >= :quantity', { quantity: item.quantity })
          .execute();

        if (result.affected === 0) {
          throw new Error(`Sản phẩm ${item.product_id} không đủ tồn kho.`);
        }
      }
    });
  }

  @ActivityMethod()
  releaseInventory(orderId: number, items: OrderItemDto[]): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Đang nhả kho (Rollback)...`);

    return this.dataSource.transaction(async (manager: EntityManager) => {
      for (const item of items) {
        await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            reserved_quantity: () => `reserved_quantity - ${item.quantity}`,
          })
          .where('product_id = :productId', { productId: item.product_id })
          // Idempotency: Đảm bảo không trừ xuống âm
          .andWhere('reserved_quantity >= :quantity', { quantity: item.quantity })
          .execute();
      }
    });
  }

  /**
   * Bước này cực kỳ quan trọng: Gọi khi Thanh toán thành công.
   * Nó sẽ trừ hẳn vào Stock và giải phóng Reserved.
   */
  @ActivityMethod()
  confirmInventory(orderId: number, items: OrderItemDto[]): Promise<void> {
    this.logger.log(`[Order ${orderId}] Xác nhận trừ kho vĩnh viễn.`);

    return this.dataSource.transaction(async (manager: EntityManager) => {
      for (const item of items) {
        const result = await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            stock: () => `stock - ${item.quantity}`,
            reserved_quantity: () => `reserved_quantity - ${item.quantity}`,
          })
          .where('product_id = :productId', { productId: item.product_id })
          .andWhere('reserved_quantity >= :quantity', { quantity: item.quantity })
          .execute();

        if (result.affected === 0) {
          throw new Error(`Lỗi đối soát kho cho sản phẩm ${item.product_id}`);
        }
      }
    });
  }

  /**
   * Khôi phục tồn kho khi hủy đơn hàng đã hoàn tất.
   * Cộng lại stock cho các sản phẩm đã bị trừ.
   */
  @ActivityMethod()
  restoreInventory(orderId: number, items: OrderItemDto[]): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Khôi phục tồn kho (Cancel Order)...`);

    return this.dataSource.transaction(async (manager: EntityManager) => {
      for (const item of items) {
        await manager
          .createQueryBuilder()
          .update(InventoryEntity)
          .set({
            stock: () => `stock + ${item.quantity}`,
          })
          .where('product_id = :productId', { productId: item.product_id })
          .execute();
      }
    });
  }
}
