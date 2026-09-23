import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoryEntity } from './entity/product-category.entity';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryRepository } from './repository/product-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategoryEntity])],
  providers: [ProductCategoryService, ProductCategoryRepository],
  exports: [ProductCategoryRepository],
})
export class ProductCategoryModule {}
