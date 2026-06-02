import { RpcExceptionFilter } from '@libs/common/filter';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { RecommendationServiceModule } from './recommendation-service.module';

async function bootstrap() {
  const app = await NestFactory.create(RecommendationServiceModule);
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
