import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedTemporalModule } from '@temporal/temporal.module';
import { OrderController } from './order-service.controller';
import { OrderService } from './order-service.service';

@Module({
  imports: [ConfigModule.forRoot(), SharedTemporalModule.forRoot()],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderServiceModule {}
