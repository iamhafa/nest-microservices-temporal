import { RpcExceptionFilter } from '@libs/common/filter';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { InventoryServiceModule } from './inventory-service.module';

async function bootstrap() {
  const app = await NestFactory.create(InventoryServiceModule);
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
