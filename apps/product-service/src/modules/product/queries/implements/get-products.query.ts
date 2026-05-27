import { Query } from '@nestjs/cqrs';
import { ProductEntity } from '../../entity/product.entity';

export class GetProductsQuery extends Query<ProductEntity[]> {}
