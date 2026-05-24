import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryController } from './inventory-service.controller';
import { InventoryService } from './inventory-service.service';
import { InventoryRepository } from './repository/inventory.repository';
import { ReserveInventoryActity } from './activity/reserve-inventory.actity';
import { ReleaseInventoryActivity } from './activity/release-inventory.activity';
import { ConfirmInventoryActivity } from './activity/confirm-inventory.activity';
import { RestoreInventoryActivity } from './activity/restore-inventory.activity';
import { InitializeInventoryActivity } from './activity/initialize-inventory.activity';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/inventory-service/.env'), join(cwd(), '.env')],
    }),

    // Custom dynamic modules
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
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [InventoryEntity],
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    SharedTemporalModule.forRoot({
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
  ],
  controllers: [InventoryController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
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
