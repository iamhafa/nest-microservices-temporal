import { AppException } from '@libs/common/exception/app-exception';
import { ProductErrorCode } from '@libs/contract/product/error';
import { HttpStatus } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In } from 'typeorm';
import { ProductCategoryRepository } from '../../../product-category/repository/product-category.repository';
import { ProductTagEntity } from '../../../product-tag/entity/product-tag.entity';
import { ProductTagRepository } from '../../../product-tag/repository/product-tag.repository';
import { ProductRepository } from '../../repository/product.repository';
import { UpdateProductCommand } from '../implement/update-product.command';
import { ProductBrandRepository } from '../../../product-brand/repository/product-brand.repository';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productBrandRepository: ProductBrandRepository,
    private readonly productTagRepository: ProductTagRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<any> {
    const { updateProductDto } = command;
    const { id, category_id, brand_id, tag_ids, image_urls, ...productData } = updateProductDto;

    // 1. Map image_urls to ProductImageEntity objects if provided
    const images = image_urls?.map((url: string, index: number) => ({
      image_url: url,
      is_thumbnail: index === 0,
    }));

    // 2. Validate Category if provided
    if (category_id) {
      const category = await this.productCategoryRepository.findOneBy({ id: category_id });
      if (!category) {
        throw new AppException({
          code: ProductErrorCode.CATEGORY_NOT_FOUND,
          message: `Category #${category_id} not found`,
        });
      }
    }

    // 3. Validate Brand if provided
    if (brand_id) {
      const brand = await this.productBrandRepository.findOneBy({ id: brand_id });
      if (!brand) {
        throw new AppException({
          code: ProductErrorCode.BRAND_NOT_FOUND,
          message: `Brand #${brand_id} not found`,
        });
      }
    }

    // 4. Validate Tags if provided
    let tags: Pick<ProductTagEntity, 'id'>[] = [];
    if (tag_ids && tag_ids.length > 0) {
      const foundTags: ProductTagEntity[] = await this.productTagRepository.find({
        where: {
          id: In(tag_ids),
        },
      });

      const foundIds = new Set(foundTags.map(t => t.id));
      const missingIds = tag_ids.filter(id => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new AppException({
          code: ProductErrorCode.TAG_NOT_FOUND,
          message: `Tags not found: ${missingIds.join(', ')}`,
        });
      }

      // Prepare shorthand objects for relation update
      tags = tag_ids.map((id: number) => ({ id }));
    }

    // 5. Preload and Save (Handle partial updates and relationships)
    const productToUpdate = await this.productRepository.preload({
      id,
      category_id,
      brand_id,
      tags,
      images,
      ...productData,
    });

    if (!productToUpdate) {
      throw new AppException({
        code: ProductErrorCode.NOT_FOUND,
        message: `Product #${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    await this.productRepository.save(productToUpdate);

    return {
      message: 'Product updated successfully',
      id,
    };
  }
}
