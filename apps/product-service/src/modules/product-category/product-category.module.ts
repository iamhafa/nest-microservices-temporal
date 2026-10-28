import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoryEntity } from './entity/product-category.entity.js';
import { ProductCategoryService } from './product-category.service.js';
import { ProductCategoryRepository } from './repository/product-category.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategoryEntity])],
  providers: [ProductCategoryService, ProductCategoryRepository],
  exports: [ProductCategoryRepository],
})
export class ProductCategoryModule {}
