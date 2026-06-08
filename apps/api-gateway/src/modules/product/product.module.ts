import { SharedRabbitMQModule } from '@libs/common';
import { Module } from '@nestjs/common';
import { ProductBrandController } from './product-brand.controller';
import { ProductController } from './product.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [ProductController, ProductBrandController],
})
export class ProductModule {}
