import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ProductServiceModule } from './product-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ProductServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3005,
    },
  });
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
