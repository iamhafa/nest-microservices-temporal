import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { RmqContextInterceptor, SharedRabbitMQModule } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { CreateProductActivity } from './activity/create-product.activity';
import { DeleteProductActivity } from './activity/delete-product.activity';
import { GetProductPricesActivity } from './activity/get-product-prices.activity';
import { ValidateProductMetadataActivity } from './activity/validate-product-metadata.activity';
import { ValidateProductsActivity } from './activity/validate-products.activity';
import { ProductBrandModule } from './modules/product-brand/product-brand.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductTagModule } from './modules/product-tag/product-tag.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('PRODUCT_DB_NAME'),
        autoLoadEntities: true, // must be true for TypeORM to find entities
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    // Custom dynamic modules
    SharedRabbitMQModule,
    SharedLoggerModule,
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PRODUCT,
      worker: {
        activityClasses: [
          ValidateProductMetadataActivity,
          ValidateProductsActivity,
          CreateProductActivity,
          DeleteProductActivity,
          GetProductPricesActivity,
        ],
      },
    }),

    // Feature modules
    ProductModule,
    ProductBrandModule,
    ProductCategoryModule,
    ProductTagModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
    ValidateProductMetadataActivity,
    ValidateProductsActivity,
    CreateProductActivity,
    DeleteProductActivity,
    GetProductPricesActivity,
  ],
})
export class ProductServiceModule {}
