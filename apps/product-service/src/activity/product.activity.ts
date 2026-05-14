import { AppException } from '@libs/common/exception/app-exception';
import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';
import { ProductErrorCode } from '@libs/contract/product/error';
import { IProductActivity } from '@libs/temporal/activity';
import { HttpStatus, Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { In } from 'typeorm';
import { EmbeddingService } from '../modules/embedding/embedding.service';
import { ProductBrandRepository } from '../modules/product-brand/repository/product-brand.repository';
import { ProductCategoryRepository } from '../modules/product-category/repository/product-category.repository';
import { ProductTagEntity } from '../modules/product-tag/entity/product-tag.entity';
import { ProductTagRepository } from '../modules/product-tag/repository/product-tag.repository';
import { ProductEntity } from '../modules/product/entity/product.entity';
import { ProductService } from '../modules/product/product.service';
import { ProductRepository } from '../modules/product/repository/product.repository';

@Activity({ name: 'product-activity' })
export class ProductActivity implements IProductActivity {
  private readonly logger = new Logger(ProductActivity.name);

  constructor(
    private readonly productService: ProductService,
    private readonly embeddingService: EmbeddingService,
    private readonly productRepository: ProductRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly productBrandRepository: ProductBrandRepository,
    private readonly productTagRepository: ProductTagRepository,
  ) {}

  @ActivityMethod()
  async validateProductMetadata(productDto: CreateProductDto | UpdateProductDto): Promise<void> {
    const { category_id, brand_id, tag_ids } = productDto;
    this.logger.log(`Validating metadata for product: ${productDto.name}`);

    // Validate Category
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

    // Validate Brand
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

    // Validate Tags
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

  @ActivityMethod()
  async validateProducts(productIds: number[]): Promise<boolean> {
    this.logger.log(`Validating products: ${productIds.join(', ')}`);

    const products: ProductEntity[] = await this.productRepository.find({
      where: {
        id: In(productIds),
        is_active: true,
      },
    });

    const foundIds = new Set(products.map(product => product.id));
    const missingIds: number[] = productIds.filter(productId => !foundIds.has(productId));

    if (missingIds.length > 0) {
      this.logger.warn(`Products not found or inactive: ${missingIds.join(', ')}`);
      return false;
    }

    this.logger.log(`All ${productIds.length} products validated successfully`);

    return true;
  }

  @ActivityMethod()
  async createProduct(createProductDto: Omit<CreateProductDto, 'quantity'>): Promise<number> {
    this.logger.log(`Creating product: ${createProductDto.name}`);

    const { tag_ids, ...productDto } = createProductDto;

    // Map tag_ids to shallow objects for relationship creation
    const tags: Pick<ProductTagEntity, 'id'>[] = tag_ids.map((id: number) => ({ id }));

    const product: ProductEntity = this.productRepository.create({
      ...productDto,
      tags,
    });

    const savedProduct: ProductEntity = await this.productRepository.save(product);
    return savedProduct.id;
  }

  @ActivityMethod()
  async deleteProduct(productId: number): Promise<void> {
    this.logger.warn(`Compensating: Deleting product ${productId}`);
    await this.productRepository.softDelete(productId);
  }

  @ActivityMethod()
  async getProductPrices(productIds: number[]): Promise<Record<number, number>> {
    this.logger.log(`Fetching prices for products: ${productIds.join(', ')}`);
    const products: ProductEntity[] = await this.productRepository.find({
      where: { id: In(productIds), is_active: true },
      select: { id: true, price: true },
    });

    // Convert array to map
    const productPrices: Record<number, number> = {};
    for (const product of products) {
      productPrices[product.id] = product.price; // key is product id, value is product price
    }

    return productPrices;
  }

  @ActivityMethod()
  async generateProductEmbedding(productId: number): Promise<void> {
    this.logger.log(`Generating embedding for product ${productId}`);
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
      relations: {
        category: true,
        brand: true,
        tags: true,
      },
    });

    if (!product) {
      this.logger.warn(`Product ${productId} not found for embedding generation`);
      return;
    }

    const text: string = this.embeddingService.buildProductText(product);
    const embedding: number[] = await this.embeddingService.generateEmbedding(text);

    await this.productService.updateEmbedding(productId, embedding);
    this.logger.log(`Embedding generated and saved for product ${productId}`);
  }
}
