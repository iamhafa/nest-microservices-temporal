import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { OrderItemEntity } from '../entity/order-item.entity.js';

@Injectable()
export class OrderItemRepository extends Repository<OrderItemEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(OrderItemEntity, entityManager);
  }
}
