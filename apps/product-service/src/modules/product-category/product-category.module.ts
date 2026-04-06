import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { Module } from '@nestjs/common';
import { ProductCategoryEntity } from './entity/product-category.entity';

@Module({
  imports: [SharedTypeOrmModule.forFeature([ProductCategoryEntity])],
  controllers: [],
  providers: [],
})
export class ProductCategoryModule {}
