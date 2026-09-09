import { SharedLoggerModule } from '@libs/common';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ global: true }),
    TemporalModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TemporalOptions => ({
        connection: {
          address: config.getOrThrow<string>('TEMPORAL_HOST'),
          namespace: config.getOrThrow<string>('TEMPORAL_NAMESPACE'),
        },
        workers: [
          {
            taskQueue: WorkFlowTaskQueue.ORDER,
            workflowsPath: join(__dirname, 'workflows/order'),
            workerOptions: {
              maxConcurrentWorkflowTaskExecutions: 50, // Giới hạn 50 Workflow Task xử lý đồng thời cho Order Saga
            },
          },
          {
            taskQueue: WorkFlowTaskQueue.PRODUCT,
            workflowsPath: join(__dirname, 'workflows/product'),
            workerOptions: {
              maxConcurrentWorkflowTaskExecutions: 50, // Giới hạn 50 Workflow Task xử lý đồng thời cho Product Workflow
            },
          },
        ],
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'orchestrator-worker' }),
  ],
  providers: [],
})
export class OrchestratorWorkerModule {}
