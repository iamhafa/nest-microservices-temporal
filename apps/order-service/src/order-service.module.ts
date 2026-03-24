import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { cwd } from 'process';
import { OrderActivity } from './activity/order.activity';
import { OrderItemEntity } from './entity/order-item.entity';
import { OrderEntity } from './entity/order.entity';
import { OrderController } from './order-service.controller';
import { OrderService } from './order-service.service';
import { OrderRepository } from './repository/order.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/order-service/.env'), join(cwd(), '.env')],
    }),

    // Custom dynamic modules
    SharedLoggerModule,
    SharedTypeOrmModule.forRoot([OrderEntity, OrderItemEntity]),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.ORDER,
      worker: {
        activityClasses: [OrderActivity],
      },
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderActivity, OrderRepository],
})
export class OrderServiceModule {}
