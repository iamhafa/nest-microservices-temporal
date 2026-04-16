import { RpcExceptionFilter } from '@libs/common/filter/rpc-exception.filter';
import { RmqCorrelationIdInterceptor } from '@libs/common/interceptor/rmq-correlation-id.interceptor';
import { SharedLoggerModule } from '@libs/common/logger/shared-logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { cwd } from 'process';
import { UserRepository } from './repository/user.repository';
import { UserController } from './user-service.controller';
import { UserService } from './user-service.service';

@Module({
  imports: [
    // Core Modules
    ClsModule.forRoot({ global: true }),
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), 'apps/user-service/.env'), join(cwd(), '.env')],
    }),

    // Auth Core
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('DB_NAME'),
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqCorrelationIdInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: RpcExceptionFilter,
    },
    UserService,
    UserRepository,
  ],
})
export class UserServiceModule {}
