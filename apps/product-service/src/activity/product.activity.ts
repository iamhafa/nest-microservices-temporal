import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { UpdateProductDto } from '@libs/contract/product/dto/update-product.dto';
import { IProductActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { In, Repository } from 'typeorm';
import { ProductBrandEntity } from '../modules/product-brand/entity/product-brand.entity';
import { ProductCategoryEntity } from '../modules/product-category/entity/product-category.entity';
import { ProductTagEntity } from '../modules/product-tag/entity/product-tag.entity';
import { ProductEntity } from '../modules/product/entity/product.entity';

@Activity({ name: 'product-activity' })
export class ProductActivity implements IProductActivity {
  private readonly logger = new Logger(ProductActivity.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(ProductTagEntity)
    private readonly productTagRepository: Repository<ProductTagEntity>,

    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,

    @InjectRepository(ProductBrandEntity)
    private readonly productBrandRepository: Repository<ProductBrandEntity>,
  ) {}

  @ActivityMethod()
  async validateProductMetadata(productDto: CreateProductDto | UpdateProductDto): Promise<void> {
    const { category_id, brand_id, tag_ids } = productDto;
    this.logger.log(`Validating metadata for product: ${productDto.name}`);

    // Validate Category
    if (category_id) {
      const category = await this.productCategoryRepository.findOneBy({ id: category_id });
      if (!category) {
        throw new RpcException(`Category #${category_id} not found`);
      }
    }

    // Validate Brand
    if (brand_id) {
      const brand = await this.productBrandRepository.findOneBy({ id: brand_id });
      if (!brand) {
        throw new RpcException(`Brand #${brand_id} not found`);
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
        throw new RpcException(`Tags not found: ${missingIds.join(', ')}`);
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
}
