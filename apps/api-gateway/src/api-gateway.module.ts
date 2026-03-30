import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { UserModule } from './modules/user/user.module';

import { JwtAuthGuard } from '@libs/common/auth';
import { JwtModule } from '@nestjs/jwt';

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
        idGenerator: (req: Request) => (req.headers['x-correlation-id'] as string) ?? randomUUID(),
        setup: (clsService: ClsService, req: Request, res: Response): void => {
          const id: string = clsService.getId();
          req.headers['x-correlation-id'] = id; // Set header for downstream services
          res.setHeader('x-correlation-id', id); // Set header for client
          clsService.set('correlationId', id); // Set correlationId for logger
        },
      },
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
  ],
})
export class ApiGatewayModule {}
