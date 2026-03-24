import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { OrchestratorWorkerModule } from './orchestrator-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(OrchestratorWorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
