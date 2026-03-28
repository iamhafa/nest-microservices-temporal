import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ShippingEntity } from '../entity/shipping.entity';

@Injectable()
export class ShippingRepository extends Repository<ShippingEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ShippingEntity, entityManager);
  }
}
