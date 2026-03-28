import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'INVENTORY_SERVICE_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService, ClsService],
        useFactory: (configService: ConfigService, clsService: ClsService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'inventory-service-queue',
            queueOptions: {
              durable: true, // if false, queue will be deleted when rabbitmq restart
            },
            headers: {
              ['x-correlation-id']: clsService.getId(),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [InventoryController],
})
export class InventoryModule {}
