import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { RmqContextInterceptor, SharedRabbitMQModule } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { CreateShipmentActivity } from './activity/create-shipment.activity';
import { ShippingEntity } from './entity/shipping.entity';
import { ShippingRepository } from './repository/shipping.repository';
import { ShippingService } from './shipping-service.service';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('SHIPPING_DB_NAME'),
        entities: [ShippingEntity],
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    // Custom dynamic modules
    SharedRabbitMQModule,
    SharedLoggerModule,
    TemporalModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TemporalOptions => ({
        connection: {
          address: config.getOrThrow<string>('TEMPORAL_HOST'),
          namespace: config.getOrThrow<string>('TEMPORAL_NAMESPACE'),
        },
        taskQueue: WorkFlowTaskQueue.SHIPPING,
        worker: {
          activityClasses: [CreateShipmentActivity],
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
    },
    ShippingService,
    CreateShipmentActivity,
    ShippingRepository,
  ],
})
export class ShippingServiceModule {}
