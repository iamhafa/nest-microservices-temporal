import { RmqRpcExceptionFilter, RmqRpcResponseInterceptor } from '@libs/messaging';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ProductServiceModule } from './product-service.module';

async function bootstrap() {
  // Kìm các log khởi tạo vào buffer để chờ custom logger (Pino) format
  const app: NestExpressApplication = await NestFactory.create(ProductServiceModule, { bufferLogs: true });
  const logger: Logger = app.get(Logger);

  app.useLogger(logger);
  app.flushLogs(); // Xả toàn bộ log trong buffer ra màn hình bằng custom logger
  app.useGlobalFilters(new RmqRpcExceptionFilter());
  app.useGlobalInterceptors(new RmqRpcResponseInterceptor());
  app.enableShutdownHooks();

  await app.init();
}
bootstrap();
