import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProductEntity } from '../../entity/product.entity';
import { ProductRepository } from '../../repository/product.repository';
import { GetProductsQuery } from '../implement/get-products.query';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(private readonly productRepository: ProductRepository) {}

  execute(): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: {
        is_active: true,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
        images: true,
      },
      select: {
        category: {
          id: true,
          name: true,
          slug: true,
        },
        brand: {
          id: true,
          name: true,
        },
        tags: {
          id: true,
          name: true,
        },
        images: {
          id: true,
          image_url: true,
          is_thumbnail: true,
        },
      },
    });
  }
}
