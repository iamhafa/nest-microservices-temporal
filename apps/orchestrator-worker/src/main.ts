import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { OrchestratorWorkerModule } from './orchestrator-worker.module';

async function bootstrap() {
  // Kìm các log khởi tạo vào buffer để chờ custom logger (Pino) format
  const app: NestExpressApplication = await NestFactory.create(OrchestratorWorkerModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs(); // Xả toàn bộ log trong buffer ra màn hình bằng custom logger
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
