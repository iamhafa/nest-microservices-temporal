import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(OrderServiceModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3002,
    },
  });
  await app.startAllMicroservices();
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
