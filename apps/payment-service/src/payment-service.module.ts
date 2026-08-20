import { StripeModule, StripeModuleConfig } from '@golevelup/nestjs-stripe';
import { SharedLoggerModule } from '@libs/common';
import { RmqContextInterceptor, SharedRabbitMQModule } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { ChargePaymentActivity } from './activity/charge-payment.activity';
import { RefundPaymentActivity } from './activity/refund-payment.activity';
import { PaymentTransactionEntity } from './entity/payment-transaction.entity';
import { PaymentTransactionRepository } from './repository/payment-transaction.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ global: true }),

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
        database: configService.getOrThrow<string>('PAYMENT_DB_NAME'),
        entities: [PaymentTransactionEntity],
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    TemporalModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TemporalOptions => ({
        connection: {
          address: config.getOrThrow<string>('TEMPORAL_HOST'),
          namespace: config.getOrThrow<string>('TEMPORAL_NAMESPACE'),
        },
        taskQueue: WorkFlowTaskQueue.PAYMENT,
        worker: {
          activityClasses: [ChargePaymentActivity, RefundPaymentActivity],
          workerOptions: {
            maxConcurrentActivityTaskExecutions: 10, // Giới hạn tối đa 10 activity xử lý đồng thời trên worker này (Bulkhead ở cấp độ Worker)
            maxActivitiesPerSecond: 5, // Giới hạn tần suất xử lý tối đa 5 activity/giây để bảo vệ Stripe API khỏi Rate Limit
          },
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'payment-service' }),
    SharedRabbitMQModule,
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
