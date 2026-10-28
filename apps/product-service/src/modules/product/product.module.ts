import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBrandModule } from '../product-brand/product-brand.module.js';
import { ProductCategoryModule } from '../product-category/product-category.module.js';
import { ProductTagModule } from '../product-tag/product-tag.module.js';
import { ProductImageEntity } from './entity/product-image.entity.js';
import { ProductEntity } from './entity/product.entity.js';
import { ProductService } from './product.service.js';
import { ProductImageRepository } from './repository/product-image.repository.js';
import { ProductRepository } from './repository/product.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductImageEntity]),
    ProductCategoryModule,
    ProductBrandModule,
    ProductTagModule,
  ],
  providers: [ProductService, ProductRepository, ProductImageRepository],
  exports: [ProductRepository, ProductImageRepository],
})
export class ProductModule {}
