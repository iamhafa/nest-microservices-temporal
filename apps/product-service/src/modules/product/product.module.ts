import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBrandModule } from '../product-brand/product-brand.module';
import { ProductCategoryModule } from '../product-category/product-category.module';
import { ProductTagModule } from '../product-tag/product-tag.module';
import { ProductImageEntity } from './entity/product-image.entity';
import { ProductEntity } from './entity/product.entity';
import { ProductController } from './product.controller';
import { ProductImageRepository } from './repository/product-image.repository';
import { ProductRepository } from './repository/product.repository';
import { CreateProductHandler } from './command/handler/create-product.handler';
import { UpdateProductHandler } from './command/handler/update-product.handler';
import { DeleteProductHandler } from './command/handler/delete-product.handler';
import { GetProductsHandler } from './query/handler/get-products.handler';
import { GetProductHandler } from './query/handler/get-product.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductImageEntity]),
    CqrsModule.forRoot(),
    ProductCategoryModule,
    ProductBrandModule,
    ProductTagModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductRepository,
    ProductImageRepository,

    // Command Handlers
    CreateProductHandler,
    UpdateProductHandler,
    DeleteProductHandler,

    // Query Handlers
    GetProductsHandler,
    GetProductHandler,
  ],
  exports: [ProductRepository, ProductImageRepository],
})
export class ProductModule {}
