import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { cwd } from 'process';
import { PaymentActivities } from './activity/payment.activity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/payment-service/.env'), join(cwd(), '.env')],
    }),
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
