import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { SharedRabbitMQModule } from '@libs/common/rabbitmq';
import { WorkFlowTaskQueue } from '@libs/temporal/queue';
import { SharedTemporalModule } from '@libs/temporal/shared-temporal.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { OrderItemEntity } from './entity/order-item.entity';
import { OrderEntity } from './entity/order.entity';
import { OrderService } from './order-service.service';
import { OrderRepository } from './repository/order.repository';
import { CreateOrderActivity } from './activity/create-order.activity';
import { DeleteOrderActivity } from './activity/delete-order.activity';
import { SavePaymentIdActivity } from './activity/save-payment-id.activity';
import { UpdateOrderStatusActivity } from './activity/update-order-status.activity';
import { GetOrderTotalAmountActivity } from './activity/get-order-total-amount.activity';
import { GetOrderItemsActivity } from './activity/get-order-items.activity';
import { GetPaymentIdActivity } from './activity/get-payment-id.activity';
import { OrderItemRepository } from './repository/order-item.repository';

@Module({
  imports: [
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(cwd(), 'apps/order-service/.env'), join(cwd(), '.env')],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [OrderEntity, OrderItemEntity],
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
    SharedTemporalModule.forRoot({
      taskQueue: WorkFlowTaskQueue.ORDER,
      worker: {
        activityClasses: [
          CreateOrderActivity,
          DeleteOrderActivity,
          SavePaymentIdActivity,
          UpdateOrderStatusActivity,
          GetOrderTotalAmountActivity,
          GetOrderItemsActivity,
          GetPaymentIdActivity,
        ],
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    OrderService,
    CreateOrderActivity,
    DeleteOrderActivity,
    SavePaymentIdActivity,
    UpdateOrderStatusActivity,
    GetOrderTotalAmountActivity,
    GetOrderItemsActivity,
    GetPaymentIdActivity,
    OrderRepository,
    OrderItemRepository,
  ],
})
export class OrderServiceModule {}
