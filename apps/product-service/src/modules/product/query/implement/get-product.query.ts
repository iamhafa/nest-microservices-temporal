import { Query } from '@nestjs/cqrs';
import { ProductEntity } from '../../entity/product.entity';

export class GetProductQuery extends Query<ProductEntity> {
  constructor(public readonly id: number) {
    super();
  }
}
