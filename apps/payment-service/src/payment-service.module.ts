import { StripeModule, StripeModuleConfig } from '@golevelup/nestjs-stripe';
import { SharedClsModule, SharedLoggerModule } from '@libs/common';
import { ResiliencePreset } from '@libs/contract/base';
import { SharedRabbitMQModule } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResilienceModule } from '@nestjs/resilience';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { ChargePaymentActivity } from './activity/charge-payment.activity.js';
import { RefundPaymentActivity } from './activity/refund-payment.activity.js';
import { PaymentTransactionEntity } from './entity/payment-transaction.entity.js';
import { PaymentService } from './payment-service.service.js';
import { PaymentTransactionRepository } from './repository/payment-transaction.repository.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ResilienceModule.forRoot({
      presets: {
        [ResiliencePreset.STRIPE_PAYMENT_GATEWAY]: {
          circuitBreaker: {
            name: 'stripe-circuit-breaker',
            failureRateThreshold: 50, // Trip open if failure rate reaches >= 50%
            minimumCalls: 5, // Minimum requests required before calculating failure rate
            openDuration: '30s', // Cooldown duration in Open state before testing recovery
            halfOpenMaxCalls: 1, // Single probe request allowed in Half-Open state
          },
          /**
           * No retry/timeout here: Temporal owns retries, the Stripe SDK owns the request timeout.
           */
        },
      },
    }),
    StripeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): StripeModuleConfig => ({
        apiKey: configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
        appInfo: {
          name: 'nest-microservices-temporal',
          version: '0.0.1',
        },
        maxNetworkRetries: 0, // Temporal owns retries; one request per call so the circuit breaker counts every failure
        timeout: 9000, // Only per-request timeout; keep well below the activity startToCloseTimeout (30s)
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
        errorMapping: true, // 4xx HttpException from activities → non-retryable ApplicationFailure
        runtime: {
          logger: 'nest', // Send Temporal SDK logs to Pino (full meta, no depth limit)
        },
        worker: {
          activityClasses: [ChargePaymentActivity, RefundPaymentActivity],
          workerOptions: {
            maxConcurrentActivityTaskExecutions: 10,
            maxActivitiesPerSecond: 5,
          },
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'payment-service' }),
    SharedRabbitMQModule.forRoot(),
    SharedClsModule.forRoot(),
  ],
  providers: [PaymentService, ChargePaymentActivity, RefundPaymentActivity, PaymentTransactionRepository],
})
export class PaymentServiceModule {}
