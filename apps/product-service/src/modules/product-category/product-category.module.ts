import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoryEntity } from './entity/product-category.entity';
import { ProductCategoryRepository } from './repository/product-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategoryEntity])],
  controllers: [],
  providers: [ProductCategoryRepository],
  exports: [ProductCategoryRepository],
})
export class ProductCategoryModule {}
