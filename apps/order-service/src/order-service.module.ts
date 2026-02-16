import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { cwd } from 'process';
import { OrderActivity } from './activity/order.activity';
import { OrderItemEntity } from './entity/order-item.entity';
import { OrderEntity } from './entity/order.entity';
import { OrderController } from './order-service.controller';
import { OrderService } from './order-service.service';
import { OrderRepository } from './repository/order.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(cwd(), 'apps/order-service/.env'), join(cwd(), '.env')],
    }),
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),

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
      taskQueue: WorkFlowTaskQueue.ORDER,
      worker: {
        activityClasses: [OrderActivity],
      },
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderActivity, OrderRepository],
})
export class OrderServiceModule {}
