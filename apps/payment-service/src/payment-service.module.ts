import { StripeModule } from '@golevelup/nestjs-stripe';
import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor/rmq-correlation-id.interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { PaymentActivities } from './activity/payment.activity';
import { PaymentTransactionEntity } from './entity/payment-transaction.entity';
import { PaymentTransactionRepository } from './repository/payment-transaction.repository';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(cwd(), 'apps/payment-service/.env'), join(cwd(), '.env')],
    }),
    StripeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.getOrThrow<string>('STRIPE_SECRET_KEY'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [PaymentTransactionEntity],
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule,
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PAYMENT,
      worker: {
        activityClasses: [PaymentActivities],
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    PaymentActivities,
    PaymentTransactionRepository,
  ],
})
export class PaymentServiceModule {}
