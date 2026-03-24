import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { SharedTypeOrmModule } from '@libs/common/typeorm/shared-typeorm.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { cwd } from 'process';
import { InventoryActivity } from './activity/inventory.activity';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryController } from './inventory-service.controller';
import { InventoryService } from './inventory-service.service';
import { InventoryRepository } from './repository/inventory.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/inventory-service/.env'), join(cwd(), '.env')],
    }),

    // Custom dynamic modules
    SharedLoggerModule,
    SharedTypeOrmModule.forRoot([InventoryEntity]),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.INVENTORY,
      worker: {
        activityClasses: [InventoryActivity],
      },
    }),
  ],
  controllers: [InventoryController],
  providers: [InventoryActivity, InventoryRepository, InventoryService],
})
export class InventoryServiceModule {}
