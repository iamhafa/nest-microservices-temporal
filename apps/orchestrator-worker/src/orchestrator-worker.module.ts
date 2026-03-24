import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),

    // Custom dynamic modules
    SharedLoggerModule,
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.ORDER,
      worker: {
        workflowsPath: join(__dirname, 'workflows/order'),
      },
    }),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PRODUCT,
      worker: {
        workflowsPath: join(__dirname, 'workflows/product'),
      },
    }),
  ],
})
export class OrchestratorWorkerModule {}
