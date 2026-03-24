import { RpcExceptionFilter } from '@libs/common/filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrderServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@localhost:5672'],
      queue: 'order-service-queue',
      queueOptions: { durable: true },
    },
  });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
