import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ProductImageEntity } from '../entity/product-image.entity';

@Injectable()
export class ProductImageRepository extends Repository<ProductImageEntity> {
  constructor(protected entityManager: EntityManager) {
    super(ProductImageEntity, entityManager);
  }
}
