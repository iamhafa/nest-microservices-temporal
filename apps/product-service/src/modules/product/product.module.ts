import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ProductBrandModule } from '../product-brand/product-brand.module';
import { ProductCategoryModule } from '../product-category/product-category.module';
import { ProductTagModule } from '../product-tag/product-tag.module';
import { ProductEntity } from './entity/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repository/product.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    ProductCategoryModule,
    ProductBrandModule,
    ProductTagModule,
    EmbeddingModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
