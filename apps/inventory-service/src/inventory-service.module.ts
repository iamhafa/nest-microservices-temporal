import { SharedLoggerModule } from '@libs/common';
import { RmqContextInterceptor, SharedRabbitMQModule } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { ConfirmInventoryActivity } from './activity/confirm-inventory.activity';
import { InitializeInventoryActivity } from './activity/initialize-inventory.activity';
import { ReleaseInventoryActivity } from './activity/release-inventory.activity';
import { ReserveInventoryActity } from './activity/reserve-inventory.actity';
import { RestoreInventoryActivity } from './activity/restore-inventory.activity';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryService } from './inventory-service.service';
import { InventoryRepository } from './repository/inventory.repository';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot(),

    // Custom dynamic modules
    SharedRabbitMQModule,
    SharedLoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('INVENTORY_DB_NAME'),
        entities: [InventoryEntity],
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
        taskQueue: WorkFlowTaskQueue.INVENTORY,
        worker: {
          activityClasses: [
            ReserveInventoryActity,
            ReleaseInventoryActivity,
            ConfirmInventoryActivity,
            RestoreInventoryActivity,
            InitializeInventoryActivity,
          ],
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
    ReserveInventoryActity,
    ReleaseInventoryActivity,
    ConfirmInventoryActivity,
    RestoreInventoryActivity,
    InitializeInventoryActivity,
    InventoryRepository,
    InventoryService,
  ],
})
export class InventoryServiceModule {}
