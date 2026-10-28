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
import { ChargePaymentActivity } from './activity/charge-payment.activity';
import { RefundPaymentActivity } from './activity/refund-payment.activity';
import { PaymentTransactionEntity } from './entity/payment-transaction.entity';
import { PaymentService } from './payment-service.service';
import { PaymentTransactionRepository } from './repository/payment-transaction.repository';

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
          retry: {
            attempts: 2, // Max attempts (1 initial call + 1 local retry)
            backoff: {
              delay: '500ms', // Initial delay before retrying
              maxDelay: '2s', // Maximum backoff delay cap
            },
          },
          timeout: '10s', // Hard deadline per request to avoid hanging calls
        },
      },
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
            maxConcurrentActivityTaskExecutions: 10,
            maxActivitiesPerSecond: 5,
          },
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'payment-service' }),
    SharedRabbitMQModule,
    SharedClsModule.forRoot(),
  ],
  providers: [PaymentService, ChargePaymentActivity, RefundPaymentActivity, PaymentTransactionRepository],
})
export class PaymentServiceModule {}
