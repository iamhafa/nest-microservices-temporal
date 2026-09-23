import { Module } from '@nestjs/common';
import { ProductBrandController } from './product-brand.controller';
import { ProductCategoryController } from './product-category.controller';
import { ProductController } from './product.controller';
import { ProductTagController } from './product-tag.controller';

@Module({
  imports: [],
  controllers: [ProductController, ProductBrandController, ProductCategoryController, ProductTagController],
})
export class ProductModule {}
