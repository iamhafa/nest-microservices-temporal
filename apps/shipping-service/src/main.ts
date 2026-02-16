import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ShippingServiceModule } from './shipping-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ShippingServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3004,
    },
  });
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
