import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot(),

    // Feature Modules
    OrderModule,
    ProductModule,
  ],
})
export class ApiGatewayModule {}
