import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor/rmq-correlation-id.interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { ShippingActivities } from './activity/shipping.activity';
import { ShippingRepository } from './repository/shipping.repository';
import { ShippingController } from './shipping-service.controller';
import { ShippingService } from './shipping-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/shipping-service/.env'), join(cwd(), '.env')],
    }),
    ClsModule.forRoot({ global: true }),

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
        autoLoadEntities: true,
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.SHIPPING,
      worker: {
        activityClasses: [ShippingActivities],
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    ShippingService,
    ShippingActivities,
    ShippingRepository,
  ],
  controllers: [ShippingController],
})
export class ShippingServiceModule {}
