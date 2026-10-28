import { Module } from '@nestjs/common';
import { ProductBrandController } from './product-brand.controller.js';
import { ProductCategoryController } from './product-category.controller.js';
import { ProductController } from './product.controller.js';
import { ProductTagController } from './product-tag.controller.js';

@Module({
  imports: [],
  controllers: [ProductController, ProductBrandController, ProductCategoryController, ProductTagController],
})
export class ProductModule {}
