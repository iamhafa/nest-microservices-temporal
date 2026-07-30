import type { ICreateProductDto } from '@libs/contract/product';
import { ICreateProductActivity } from '@libs/temporal';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { ProductImageEntity } from '../modules/product/entity/product-image.entity';
import { ProductEntity } from '../modules/product/entity/product.entity';
import { ProductImageRepository } from '../modules/product/repository/product-image.repository';
import { ProductRepository } from '../modules/product/repository/product.repository';

@Activity({ name: 'create-product-activity' })
export class CreateProductActivity implements ICreateProductActivity {
  private readonly logger = new Logger(CreateProductActivity.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productImageRepository: ProductImageRepository,
  ) {}

  @ActivityMethod({ name: 'createProduct' })
  async execute(createProductDto: Omit<ICreateProductDto, 'quantity'>): Promise<number> {
    this.logger.log(`Creating product: ${createProductDto.name}`);

    const { tag_ids, image_urls, ...productDto } = createProductDto;

    const tags = tag_ids?.map((id: number) => ({ id }));

    const images: ProductImageEntity[] = this.productImageRepository.create(
      (image_urls ?? []).map((url: string, index: number) => ({
        image_url: url,
        is_thumbnail: index === 0,
      })),
    );

    const product: ProductEntity = this.productRepository.create({
      ...productDto,
      tags,
      images,
    });

    const savedProduct: ProductEntity = await this.productRepository.save(product);
    return savedProduct.id;
  }
}
