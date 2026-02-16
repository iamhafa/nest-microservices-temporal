import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { OrderEntity } from '../entity/order.entity';

@Injectable()
export class OrderRepository extends Repository<OrderEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(OrderEntity, entityManager);
  }
}
