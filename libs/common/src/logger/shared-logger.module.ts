import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LoggerModule, Params } from 'nestjs-pino';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [EnvModule, ConfigModule, ClsModule],
      inject: [ClsService, ConfigService, EnvService],
      useFactory: (clsService: ClsService, configService: ConfigService, envService: EnvService): Params => {
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
                method: req.method,
                url: req.url,
              }),
              res: (res: any) => {
                const response = res.raw as Response; // Pino wrap response object, we need to cast it to Response to access response.locals
                return {
                  statusCode: response.statusCode,
                  responseBody: response.locals?.responseBody,
                };
              },
            },
          },
        };
      },
    }),
  ],
})
export class SharedLoggerModule {}
