import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor/rmq-correlation-id.interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { ProductActivity } from './activity/product.activity';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { ProductBrandModule } from './modules/product-brand/product-brand.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductTagModule } from './modules/product-tag/product-tag.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/product-service/.env'), join(cwd(), '.env')],
    }),
    ClsModule.forRoot({ global: true }),

    // Custom dynamic modules
    SharedLoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('DB_NAME'),
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PRODUCT,
      worker: {
        activityClasses: [ProductActivity],
      },
    }),

    // Feature modules
    EmbeddingModule,
    ProductModule,
    ProductBrandModule,
    ProductCategoryModule,
    ProductTagModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    ProductActivity,
  ],
})
export class ProductServiceModule {}
