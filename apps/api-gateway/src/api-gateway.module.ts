import { JwtAuthGuard } from '@libs/common/auth';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => randomUUID(),
        setup: (clsService: ClsService, req: Request, res: Response): void => {
          const id: string = clsService.getId();
          req.headers['X-Correlation-Id'] = id; // Set header for downstream services
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
            limit: config.get<number>('RATE_LIMIT_REQUESTS', 30), // 30 requests per 60s
          },
        ],
        skipIf: (context: ExecutionContext): boolean => {
          // Skip rate limiting for health check
          const request: Request = context.switchToHttp().getRequest();
          return request.url === '/health';
        },
        errorMessage: 'Too Many Requests',
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule,

    // Feature Modules
    UserModule,
    ProductModule,
    OrderModule,
    InventoryModule,
    ShippingModule,
    RecommendationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiGatewayModule {}
