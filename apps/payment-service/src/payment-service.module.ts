import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { PaymentActivities } from './activities/payment.activities';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PAYMENT,
      worker: {
        activityClasses: [PaymentActivities],
      },
    }),
  ],
  providers: [PaymentActivities],
})
export class PaymentServiceModule {}
