import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { ShippingServiceModule } from './shipping-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ShippingServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@localhost:5672'],
      queue: 'shipping-service-queue',
      queueOptions: { durable: true },
    },
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
