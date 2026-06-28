import { StripeModule, StripeModuleConfig } from '@golevelup/nestjs-stripe';
import { RmqContextInterceptor, SharedLoggerModule, SharedRabbitMQModule } from '@libs/common';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { ChargePaymentActivity } from './activity/charge-payment.activity';
import { RefundPaymentActivity } from './activity/refund-payment.activity';
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
      useFactory: (configService: ConfigService): StripeModuleConfig => ({
        apiKey: configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
        timeout: configService.get<number>('STRIPE_TIMEOUT', 30000),
        appInfo: {
          name: 'nest-microservices-temporal',
          version: '0.0.1',
        },
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
    SharedRabbitMQModule,
    SharedLoggerModule,
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.PAYMENT,
      worker: {
        activityClasses: [ChargePaymentActivity, RefundPaymentActivity],
        workerOptions: {
          maxConcurrentActivityTaskExecutions: 10, // Giới hạn tối đa 10 activity xử lý đồng thời trên worker này (Bulkhead ở cấp độ Worker)
          maxActivitiesPerSecond: 5, // Giới hạn tần suất xử lý tối đa 5 activity/giây để bảo vệ Stripe API khỏi Rate Limit
        },
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
    ChargePaymentActivity,
    RefundPaymentActivity,
    PaymentTransactionRepository,
  ],
})
export class PaymentServiceModule {}
