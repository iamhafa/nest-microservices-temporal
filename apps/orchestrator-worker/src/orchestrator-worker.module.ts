import { SharedLoggerModule } from '@libs/common';
import { RmqContextInterceptor } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { join } from 'path';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot(),

    // Custom dynamic modules
    SharedLoggerModule,
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
          },
          {
            taskQueue: WorkFlowTaskQueue.PRODUCT,
            workflowsPath: join(__dirname, 'workflows/product'),
          },
        ],
      }),
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
  ],
})
export class OrchestratorWorkerModule {}
