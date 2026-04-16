import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ProductTagEntity } from '../entity/product-tag.entity';

@Injectable()
export class ProductTagRepository extends Repository<ProductTagEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ProductTagEntity, entityManager);
  }
}
