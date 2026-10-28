import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBrandEntity } from './entity/product-brand.entity.js';
import { ProductBrandService } from './product-brand.service.js';
import { ProductBrandRepository } from './repository/product-brand.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBrandEntity])],
  providers: [ProductBrandService, ProductBrandRepository],
  exports: [ProductBrandRepository],
})
export class ProductBrandModule {}
