import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippingActivities } from './activity/shipping.activity';

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
