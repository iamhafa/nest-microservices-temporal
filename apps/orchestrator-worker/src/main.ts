import { NestFactory } from '@nestjs/core';
import { OrchestratorWorkerModule } from './orchestrator-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(OrchestratorWorkerModule);
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
