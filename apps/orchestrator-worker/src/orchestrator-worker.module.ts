import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.ORDER,
      worker: {
        workflowsPath: join(__dirname, 'workflows/order'),
      },
    }),
  ],
})
export class OrchestratorWorkerModule {}
