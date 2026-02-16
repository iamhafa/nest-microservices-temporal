import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { cwd } from 'process';
import { InventoryActivity } from './activity/inventory.activity';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryRepository } from './repository/inventory.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(cwd(), 'apps/inventory-service/.env'), join(cwd(), '.env')],
    }),
    TypeOrmModule.forFeature([InventoryEntity]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.INVENTORY,
      worker: {
        activityClasses: [InventoryActivity],
      },
    }),
  ],
  providers: [InventoryActivity, InventoryRepository],
})
export class InventoryServiceModule {}
