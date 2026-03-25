import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { ProductActivity } from './activity/product.activity';
import { ProductEntity } from './entity/product.entity';
import { ProductController } from './product-service.controller';
import { ProductService } from './product-service.service';
import { ProductRepository } from './repository/product.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/product-service/.env'), join(cwd(), '.env')],
    }),
    ClsModule.forRoot({ global: true }),

    // Custom dynamic modules
    SharedLoggerModule,
    SharedTypeOrmModule.forRoot([ProductEntity]),

    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PRODUCT,
      worker: {
        activityClasses: [ProductActivity],
      },
    }),
  ],
  controllers: [ProductController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    ProductService,
    ProductActivity,
    ProductRepository,
  ],
})
export class ProductServiceModule {}
