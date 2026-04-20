import { HttpExceptionFilter } from '@libs/common/filter/http-exception.filter';
import { ResponseInterceptor } from '@libs/common/interceptor/response.interceptor';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiGatewayModule, { bufferLogs: true });

  app.disable('x-powered-by');
  app.useLogger(app.get(Logger));
  app.enableCors();
  app.enableShutdownHooks();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Use Swagger
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setVersion('1.0')
    .setDescription('The documentation of the API Gateway')
    .addBearerAuth(
      {
        in: 'header',
        type: 'http',
        scheme: 'bearer',
        name: 'Authorization',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'Authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    // Add custom js to swagger (auto login)
    customJsStr: `
      window.addEventListener('load', () => {
        const observer = new MutationObserver(() => {
          if (window.ui) {
            observer.disconnect();
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
              const response = await originalFetch(...args);
              if (args[0].includes('/auth/login') || args[0].includes('/auth/register')) {
                const clone = response.clone();
                clone.json().then(resData => {
                  const token = resData?.data?.access_token || resData?.access_token;
                  if (token) {
                    window.ui.preauthorizeApiKey('Authorization', token);
                  }
                }).catch(() => {});
              }
              return response;
            };
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    `,
  });

  await app.listen(3000);
}

void bootstrap();
