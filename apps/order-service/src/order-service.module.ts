import { SharedLoggerModule } from '@libs/common';
import { RmqContextInterceptor, SharedRabbitMQModule } from '@libs/messaging';
import { WorkFlowTaskQueue } from '@libs/temporal';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';
import { CreateOrderActivity } from './activity/create-order.activity';
import { DeleteOrderActivity } from './activity/delete-order.activity';
import { GetOrderItemsActivity } from './activity/get-order-items.activity';
import { GetOrderTotalAmountActivity } from './activity/get-order-total-amount.activity';
import { GetPaymentIdActivity } from './activity/get-payment-id.activity';
import { SavePaymentIdActivity } from './activity/save-payment-id.activity';
import { UpdateOrderStatusActivity } from './activity/update-order-status.activity';
import { OrderItemEntity } from './entity/order-item.entity';
import { OrderEntity } from './entity/order.entity';
import { OrderService } from './order-service.service';
import { OrderItemRepository } from './repository/order-item.repository';
import { OrderRepository } from './repository/order.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClsModule.forRoot({ global: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('ORDER_DB_NAME'),
        entities: [OrderEntity, OrderItemEntity],
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
          workerOptions: {
            maxConcurrentActivityTaskExecutions: 25, // Giới hạn 25 activity xử lý đơn hàng đồng thời
          },
        },
      }),
    }),
    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'order-service' }),
    SharedRabbitMQModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqContextInterceptor,
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
