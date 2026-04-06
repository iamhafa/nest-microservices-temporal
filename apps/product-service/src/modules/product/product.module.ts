import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { Module } from '@nestjs/common';
import { ProductBrandEntity } from '../product-brand/entity/product-brand.entity';
import { ProductCategoryEntity } from '../product-category/entity/product-category.entity';
import { ProductTagEntity } from '../product-tag/entity/product-tag.entity';
import { ProductEntity } from './entity/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    SharedTypeOrmModule.forFeature([ProductEntity, ProductCategoryEntity, ProductBrandEntity, ProductTagEntity]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
