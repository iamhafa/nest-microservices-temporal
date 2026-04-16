import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagEntity } from './entity/product-tag.entity';
import { ProductTagRepository } from './repository/product-tag.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTagEntity])],
  controllers: [],
  providers: [ProductTagRepository],
  exports: [ProductTagRepository],
})
export class ProductTagModule {}
