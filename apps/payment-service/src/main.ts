import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(PaymentServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3003,
    },
  });
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
