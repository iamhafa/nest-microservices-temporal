import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InventoryEntity } from '../entity/inventory.entity';

@Injectable()
export class InventoryRepository extends Repository<InventoryEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(InventoryEntity, entityManager);
  }
}
