import { AppException, AppExceptionOptions, HttpExceptionFilter, ResponseInterceptor } from '@libs/common';
import { SystemErrorCode } from '@libs/contract/base';
import { HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import { Logger } from 'nestjs-pino';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  // Kìm các log khởi tạo vào buffer để chờ custom logger (Pino) format
  const app: NestExpressApplication = await NestFactory.create(ApiGatewayModule, { bufferLogs: true });

  // Trust 1 layer of proxies (e.g., Nginx, Load Balancer) to get the correct client IP for rate limiting
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs(); // Xả toàn bộ log trong buffer ra màn hình bằng custom logger
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
      exceptionFactory(errors: ValidationError[]): AppExceptionOptions {
        throw new AppException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          code: SystemErrorCode.VALIDATION_FAILED,
          message: 'Validation error',
          details: errors.map((err: ValidationError) => ({
            field: err.property,
            message: Object.values(err.constraints ?? {})[0] as string,
          })),
        });
      },
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
    swaggerUiEnabled: true, // disable in production
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
                  const token = resData?.data?.access_token;
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
