import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { Module } from '@nestjs/common';
import { ProductTagEntity } from './entity/product-tag.entity';

@Module({
  imports: [SharedTypeOrmModule.forFeature([ProductTagEntity])],
  controllers: [],
  providers: [],
})
export class ProductTagModule {}
