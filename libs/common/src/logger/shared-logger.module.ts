import { Module } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [EnvModule],
      inject: [ClsService, EnvService],
      useFactory: (clsService: ClsService, envService: EnvService) => {
        const addCorrelationId = (): Record<string, string> => {
          if (clsService.isActive()) {
            const correlationId = clsService.get('correlationId');
            return correlationId ? { correlationId } : {};
          }
          return {};
        };

        return {
          forRoutes: ['/api/*path'],
          pinoHttp: {
            genReqId: (req: Request) => req.headers['X-Correlation-Id'] as string,
            transport: !envService.isProduction() ? { target: 'pino-pretty' } : undefined,
            level: !envService.isProduction() ? 'debug' : 'info',
            customProps: () => addCorrelationId(),
            mixin: () => addCorrelationId(),
            serializers: {
              req: (req: Request) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: Response) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
  ],
})
export class SharedLoggerModule {}
