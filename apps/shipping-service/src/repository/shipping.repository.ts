import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ShippingEntity } from '../entity/shipping.entity.js';

@Injectable()
export class ShippingRepository extends Repository<ShippingEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ShippingEntity, entityManager);
  }
}
