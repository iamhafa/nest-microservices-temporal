import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBrandModule } from '../product-brand/product-brand.module';
import { ProductCategoryModule } from '../product-category/product-category.module';
import { ProductTagModule } from '../product-tag/product-tag.module';
import { ProductImageEntity } from './entity/product-image.entity';
import { ProductEntity } from './entity/product.entity';
import { ProductService } from './product.service';
import { ProductImageRepository } from './repository/product-image.repository';
import { ProductRepository } from './repository/product.repository';

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
