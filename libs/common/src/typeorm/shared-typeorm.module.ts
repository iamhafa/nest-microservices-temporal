import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({})
export class SharedTypeOrmModule {
  static forRoot(entities: EntityClassOrSchema[]): DynamicModule {
    return {
      module: SharedTypeOrmModule,
      imports: [
        TypeOrmModule.forFeature(entities), // register entities
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
            type: 'postgres',
            host: configService.getOrThrow<string>('DB_HOST'),
            port: configService.getOrThrow<number>('DB_PORT'),
            username: configService.getOrThrow<string>('DB_USER'),
            password: configService.getOrThrow<string>('DB_PASS'),
            database: configService.getOrThrow<string>('DB_NAME'),
            autoLoadEntities: true,
            synchronize: true,
            invalidWhereValuesBehavior: {
              undefined: 'throw',
              null: 'throw',
            },
          }),
          inject: [ConfigService],
        }),
      ],
    };
  }
}
