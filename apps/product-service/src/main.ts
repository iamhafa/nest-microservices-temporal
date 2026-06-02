import { RpcExceptionFilter } from '@libs/common/filter';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ProductServiceModule } from './product-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductServiceModule);
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
