import { AppException } from '@libs/common';
import { ProductErrorCode } from '@libs/contract/product/error';
import { HttpStatus } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProductEntity } from '../../entity/product.entity';
import { ProductRepository } from '../../repository/product.repository';
import { GetProductQuery } from '../implement/get-product.query';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(query: GetProductQuery): Promise<ProductEntity> {
    const { id } = query;
    const product = await this.productRepository.findOne({
      where: {
        id,
        is_active: true,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
        images: true,
      },
      select: {
        category: { id: true, name: true, slug: true },
        brand: { id: true, name: true },
        tags: { id: true, name: true },
        images: { id: true, image_url: true, is_thumbnail: true },
      },
    });

    if (!product) {
      throw new AppException({
        code: ProductErrorCode.NOT_FOUND,
        message: `Product #${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    return product;
  }
}
