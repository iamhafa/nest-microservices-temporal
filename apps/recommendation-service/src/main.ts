import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { RecommendationServiceModule } from './recommendation-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(RecommendationServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@localhost:5672'],
      queue: 'recommendation-service-queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  await app.listen();
}
bootstrap();
