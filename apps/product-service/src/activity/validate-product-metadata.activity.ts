import { AppException } from '@libs/common/exception/app-exception';
import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';
import { ProductErrorCode } from '@libs/contract/product/error';
import { IValidateProductMetadata } from '@libs/temporal/activity';
import { HttpStatus, Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { In } from 'typeorm';
import { ProductCategoryRepository } from '../modules/product-category/repository/product-category.repository';
import { ProductBrandRepository } from '../modules/product-brand/repository/product-brand.repository';
import { ProductTagRepository } from '../modules/product-tag/repository/product-tag.repository';
import { ProductTagEntity } from '../modules/product-tag/entity/product-tag.entity';

@Activity({ name: 'validate-product-metadata-activity' })
export class ValidateProductMetadataActivity implements IValidateProductMetadata {
  private readonly logger = new Logger(ValidateProductMetadataActivity.name);

  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productBrandRepository: ProductBrandRepository,
    private readonly productTagRepository: ProductTagRepository,
  ) {}

  @ActivityMethod({ name: 'validateProductMetadata' })
  async execute(productDto: CreateProductDto | UpdateProductDto): Promise<void> {
    const { category_id, brand_id, tag_ids } = productDto;
    this.logger.log(`Validating metadata for product: ${productDto.name}`);

    if (category_id) {
      const category = await this.productCategoryRepository.findOneBy({ id: category_id });
      if (!category) {
        throw new AppException({
          code: ProductErrorCode.CATEGORY_NOT_FOUND,
          message: `Category #${category_id} not found`,
          status: HttpStatus.NOT_FOUND,
        });
      }
    }

    if (brand_id) {
      const brand = await this.productBrandRepository.findOneBy({ id: brand_id });
      if (!brand) {
        throw new AppException({
          code: ProductErrorCode.BRAND_NOT_FOUND,
          message: `Brand #${brand_id} not found`,
          status: HttpStatus.NOT_FOUND,
        });
      }
    }

    if (tag_ids && tag_ids.length > 0) {
      const tags: ProductTagEntity[] = await this.productTagRepository.find({
        where: { id: In(tag_ids) },
      });

      const foundIds = new Set(tags.map(tag => tag.id));
      const missingIds: number[] = tag_ids.filter(tagId => !foundIds.has(tagId));

      if (missingIds.length > 0) {
        throw new AppException({
          code: ProductErrorCode.TAG_NOT_FOUND,
          message: `Tags not found: ${missingIds.join(', ')}`,
          status: HttpStatus.NOT_FOUND,
        });
      }
    }

    this.logger.log('Metadata validation successful');
  }
}
