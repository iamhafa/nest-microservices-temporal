import { IInitializeInventoryActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';

@Activity({ name: 'initialize-inventory-activity' })
export class InitializeInventoryActivity implements IInitializeInventoryActivity {
  private readonly logger = new Logger(InitializeInventoryActivity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod({ name: 'initializeInventory' })
  async execute(productId: number, quantity: number): Promise<void> {
    this.logger.log(`[Inventory] Initializing inventory for product ${productId} with quantity ${quantity}`);

    const inventory: InventoryEntity = this.entityManager.create(InventoryEntity, {
      product_id: productId,
      stock: quantity,
      reserved_quantity: 0,
    });

    await this.entityManager.save(inventory);

    this.logger.log(`Inventory for product ${productId} initialized successfully`);
  }
}
