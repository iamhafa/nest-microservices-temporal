import { RpcExceptionFilter } from '@libs/common/filter';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  await app.init();
}
bootstrap();
