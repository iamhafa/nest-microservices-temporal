import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBrandEntity } from './entity/product-brand.entity';
import { ProductBrandController } from './product-brand.controller';
import { ProductBrandService } from './product-brand.service';
import { ProductBrandRepository } from './repository/product-brand.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBrandEntity])],
  controllers: [ProductBrandController],
  providers: [ProductBrandService, ProductBrandRepository],
  exports: [ProductBrandRepository],
})
export class ProductBrandModule {}
