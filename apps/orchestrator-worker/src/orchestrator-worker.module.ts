import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkFlowTaskQueue } from '@temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.ORDER,
      worker: {
        workflowsPath: join(__dirname, 'workflows'),
      },
    }),
  ],
})
export class OrchestratorWorkerModule {}
