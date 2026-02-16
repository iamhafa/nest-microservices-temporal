import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { InventoryServiceModule } from './inventory-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(InventoryServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
  });
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
