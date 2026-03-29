import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ProductBrandEntity } from '../entity/product-brand.entity';

@Injectable()
export class ProductBrandRepository extends Repository<ProductBrandEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(ProductBrandEntity, entityManager);
  }
}
