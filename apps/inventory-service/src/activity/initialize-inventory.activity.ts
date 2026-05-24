import { IInitializeInventory } from '@libs/temporal/activity';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { EntityManager } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';
import { Logger } from '@nestjs/common';

@Activity({ name: 'initialize-inventory-activity' })
export class InitializeInventoryActivity implements IInitializeInventory {
  private readonly logger = new Logger(InitializeInventoryActivity.name);

  constructor(private readonly entityManager: EntityManager) {}

  @ActivityMethod({ name: 'initializeInventory' })
  async execute(productId: number, quantity: number): Promise<void> {
    this.logger.log(`Initializing inventory for product ${productId} with quantity ${quantity}`);

    const inventory = this.entityManager.create(InventoryEntity, {
      product_id: productId,
      stock: quantity,
      reserved_quantity: 0,
    });
    await this.entityManager.save(inventory);
  }
}
