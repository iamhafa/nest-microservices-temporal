import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { InventoryActivity } from './activity/inventory.activity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.INVENTORY,
      worker: {
        activityClasses: [InventoryActivity],
      },
    }),
  ],
  providers: [InventoryActivity],
})
export class InventoryServiceModule {}
