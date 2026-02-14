import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { join } from 'path';
import { cwd } from 'process';
import { OrderEntity } from './entity/order.entity';
import { OrderController } from './order-service.controller';
import { OrderService } from './order-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: join(cwd(), 'apps/order-service/.env'), isGlobal: true }),
    TypeOrmModule.forFeature([OrderEntity]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log(cwd());

        return {
          type: 'postgres',
          host: configService.getOrThrow<string>('DB_HOST'),
          port: configService.getOrThrow<number>('DB_PORT'),
          username: configService.getOrThrow<string>('DB_USER'),
          password: configService.getOrThrow<string>('DB_PASS'),
          database: configService.getOrThrow<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    SharedTemporalModule.forRoot(),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderServiceModule {}
