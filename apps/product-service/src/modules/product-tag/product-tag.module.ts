import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagEntity } from './entity/product-tag.entity';
import { ProductTagService } from './product-tag.service';
import { ProductTagRepository } from './repository/product-tag.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTagEntity])],
  providers: [ProductTagService, ProductTagRepository],
  exports: [ProductTagRepository],
})
export class ProductTagModule {}
