import { SharedAuthModule } from '@libs/auth';
import { SharedClsModule, SharedLoggerModule } from '@libs/common';
import { SharedRabbitMQModule } from '@libs/messaging';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserRepository } from './repository/user.repository';
import { UserService } from './user-service.service';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASS'),
        database: configService.getOrThrow<string>('USER_DB_NAME'),
        entities: [UserEntity],
        synchronize: true,
        invalidWhereValuesBehavior: {
          undefined: 'throw',
          null: 'throw',
        },
      }),
    }),

    // Custom dynamic modules
    SharedLoggerModule.forRoot({ serviceName: 'user-service' }),
    SharedAuthModule,
    SharedRabbitMQModule,
    SharedClsModule.forRoot(),
  ],
  providers: [UserService, UserRepository],
})
export class UserServiceModule {}
