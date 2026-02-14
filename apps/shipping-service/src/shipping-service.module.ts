import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { ShippingActivities } from './activities/shipping.activities';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.SHIPPING,
      worker: {
        activityClasses: [ShippingActivities],
      },
    }),
  ],
  providers: [ShippingActivities],
})
export class ShippingServiceModule {}
