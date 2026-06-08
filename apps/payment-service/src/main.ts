import { RpcExceptionFilter } from '@libs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  // Kìm các log khởi tạo vào buffer để chờ custom logger (Pino) format
  const app: NestExpressApplication = await NestFactory.create(PaymentServiceModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs(); // Xả toàn bộ log trong buffer ra màn hình bằng custom logger
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
