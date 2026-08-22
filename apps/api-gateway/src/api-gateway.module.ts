import { SharedAuthModule } from '@libs/auth';
import { EnvironmentModule, EnvironmentService, IdempotencyInterceptor, SharedLoggerModule } from '@libs/common';
import { SharedRabbitMQModule } from '@libs/messaging';
import { RedisConnectionConfig, RedisModule } from '@nestjs-redis/client';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { PrometheusModule, PrometheusOptions } from '@willsoto/nestjs-prometheus';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => randomUUID(),
        setup: (clsService: ClsService, req: Request, res: Response): void => {
          const id: string = clsService.getId();
          res.setHeader('X-Correlation-Id', id); // Set header for client
          clsService.set('correlationId', id); // Set correlationId for logger
        },
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get<number>('RATE_LIMIT_TTL', 60000), // 60s
            limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS_PER_IP', 30), // 30 requests per 60s
          },
        ],
        skipIf: (context: ExecutionContext): boolean => {
          // Skip rate limiting for health check and metrics
          const request: Request = context.switchToHttp().getRequest();
          const isHealthCheck: boolean = request.url === '/health';
          const isPrometheus: boolean = request.url.includes('/metrics');

          return isHealthCheck || isPrometheus;
        },
        errorMessage: 'Too Many Requests',
      }),
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): RedisConnectionConfig => ({
        options: {
          name: 'default',
          url: config.getOrThrow<string>('REDIS_URL'),
          disableOfflineQueue: true,
        },
      }),
    }),
    PrometheusModule.registerAsync({
      imports: [EnvironmentModule],
      inject: [EnvironmentService],
      useFactory: (envService: EnvironmentService): PrometheusOptions => ({
        path: '/metrics',
        defaultMetrics: {
          enabled: envService.isProduction(), // only prometheus metrics when production
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'api-gateway' }),
    SharedRabbitMQModule,
    SharedAuthModule,

    // Feature Modules
    UserModule,
    ProductModule,
    OrderModule,
    InventoryModule,
    ShippingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class ApiGatewayModule {}
