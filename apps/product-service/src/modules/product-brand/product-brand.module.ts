import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { Module } from '@nestjs/common';
import { ProductBrandEntity } from './entity/product-brand.entity';
import { ProductBrandController } from './product-brand.controller';
import { ProductBrandService } from './product-brand.service';

@Module({
  imports: [SharedTypeOrmModule.forFeature([ProductBrandEntity])],
  controllers: [ProductBrandController],
  providers: [ProductBrandService],
})
export class ProductBrandModule {}
