import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ProductEntity } from '../entity/product.entity';

@Injectable()
export class ProductRepository extends Repository<ProductEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ProductEntity, entityManager);
  }
}
