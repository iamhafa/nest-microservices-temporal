import { Module } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [EnvModule, ConfigModule, ClsModule],
      inject: [ClsService, ConfigService, EnvService],
      useFactory: (clsService: ClsService, configService: ConfigService, envService: EnvService) => {
        const addCorrelationId = (): Record<string, string> => {
          if (clsService.isActive()) {
            const correlationId = clsService.get('correlationId');
            return correlationId ? { correlationId } : {};
          }
          return {};
        };

        const detectServiceName = (): string => {
          const mainFilePath: string = process.cwd();
          const matchResult = mainFilePath.match(/[/\\]apps[/\\]([^/\\]+)/);
          if (matchResult?.[1]) return matchResult[1];
          return 'unknown-service';
        };

        return {
          forRoutes: ['/api/*path'],
          pinoHttp: {
            genReqId: (req: Request) => req.headers['X-Correlation-Id'] as string,
            transport: {
              targets: [
                envService.isDevelopment()
                  ? {
                      target: 'pino-pretty',
                      level: 'debug',
                      options: {
                        colorize: true,
                      },
                    }
                  : {
                      target: 'pino-loki',
                      level: envService.isProduction() ? 'info' : 'debug',
                      options: {
                        host: configService.getOrThrow<string>('LOKI_URL'),
                        batching: true,
                        interval: 5,
                        labels: {
                          service: detectServiceName(),
                          environment: envService.isProduction() ? 'production' : 'development',
                        },
                      },
                    },
              ],
            },
            level: envService.isDevelopment() ? 'debug' : 'info',
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
