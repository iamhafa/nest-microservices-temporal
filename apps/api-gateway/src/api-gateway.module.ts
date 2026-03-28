import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot(),
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
    InventoryModule,
    OrderModule,
    ProductModule,
    ShippingModule,
  ],
})
export class ApiGatewayModule {}
