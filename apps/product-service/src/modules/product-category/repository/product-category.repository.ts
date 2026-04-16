import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ProductCategoryEntity } from '../entity/product-category.entity';

@Injectable()
export class ProductCategoryRepository extends Repository<ProductCategoryEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ProductCategoryEntity, entityManager);
  }
}
