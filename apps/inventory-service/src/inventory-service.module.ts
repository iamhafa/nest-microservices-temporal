import { RmqContextInterceptor, SharedLoggerModule, SharedRabbitMQModule } from '@libs/common';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { ConfirmInventoryActivity } from './activity/confirm-inventory.activity';
import { InitializeInventoryActivity } from './activity/initialize-inventory.activity';
import { ReleaseInventoryActivity } from './activity/release-inventory.activity';
import { ReserveInventoryActity } from './activity/reserve-inventory.actity';
import { RestoreInventoryActivity } from './activity/restore-inventory.activity';
import { dataSourceOptions } from './database/config/database.config';
import { InventoryService } from './inventory-service.service';
import { InventoryRepository } from './repository/inventory.repository';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/inventory-service/.env'), join(cwd(), '.env')],
    }),

    // Custom dynamic modules
    SharedRabbitMQModule,
    SharedLoggerModule,
    TypeOrmModule.forRoot(dataSourceOptions),

    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.INVENTORY,
      worker: {
        activityClasses: [
          ReserveInventoryActity,
          ReleaseInventoryActivity,
          ConfirmInventoryActivity,
          RestoreInventoryActivity,
          InitializeInventoryActivity,
        ],
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
    ReserveInventoryActity,
    ReleaseInventoryActivity,
    ConfirmInventoryActivity,
    RestoreInventoryActivity,
    InitializeInventoryActivity,
    InventoryRepository,
    InventoryService,
  ],
})
export class InventoryServiceModule {}
