import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ClsService, ConfigService],
      useFactory: (clsService: ClsService, config: ConfigService) => {
        const isProduction: boolean = config.get<string>('NODE_ENV') === 'production';
        const addCorrelationId = () => {
          if (clsService.isActive()) {
            const correlationId = clsService.get('correlationId');
            return correlationId ? { correlationId } : {};
          }
          return {};
        };

        return {
          pinoHttp: {
            genReqId: (req: Request) => req.headers['x-correlation-id'] as string,
            transport: !isProduction ? { target: 'pino-pretty' } : undefined,
            level: !isProduction ? 'debug' : 'info',
            customProps: addCorrelationId,
            mixin: addCorrelationId,
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
