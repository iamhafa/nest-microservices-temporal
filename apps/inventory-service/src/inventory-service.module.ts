import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { InventoryActivities } from './activities/inventory.activities';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.INVENTORY,
      worker: {
        activityClasses: [InventoryActivities],
      },
    }),
  ],
  providers: [InventoryActivities],
})
export class InventoryServiceModule {}
