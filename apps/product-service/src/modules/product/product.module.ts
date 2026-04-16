import { Module } from '@nestjs/common';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ProductBrandModule } from '../product-brand/product-brand.module';
import { ProductBrandRepository } from '../product-brand/repository/product-brand.repository';
import { ProductCategoryModule } from '../product-category/product-category.module';
import { ProductCategoryRepository } from '../product-category/repository/product-category.repository';
import { ProductTagModule } from '../product-tag/product-tag.module';
import { ProductTagRepository } from '../product-tag/repository/product-tag.repository';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repository/product.repository';

@Module({
  imports: [EmbeddingModule, ProductCategoryModule, ProductBrandModule, ProductTagModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    ProductBrandRepository,
    ProductCategoryRepository,
    ProductTagRepository,
  ],
  exports: [ProductService, EmbeddingModule, ProductRepository],
})
export class ProductModule {}
