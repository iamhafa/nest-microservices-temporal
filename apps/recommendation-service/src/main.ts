import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { RecommendationServiceModule } from './recommendation-service.module';

async function bootstrap() {
  const app = await NestFactory.create(RecommendationServiceModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
