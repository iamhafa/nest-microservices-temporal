import { NestFactory } from '@nestjs/core';
import { ShippingServiceModule } from './shipping-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ShippingServiceModule);
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
