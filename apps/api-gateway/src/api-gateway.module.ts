import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot(),
    SharedLoggerModule,

    // Feature Modules
    InventoryModule,
    OrderModule,
    ProductModule,
  ],
})
export class ApiGatewayModule {}
