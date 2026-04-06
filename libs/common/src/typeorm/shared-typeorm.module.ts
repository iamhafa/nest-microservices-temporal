import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Global()
@Module({})
export class SharedTypeOrmModule {
  static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
    return {
      module: SharedTypeOrmModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: [TypeOrmModule], // export to use TypeOrmModule in other modules
    };
  }

  static forRoot(): DynamicModule {
    return {
      module: SharedTypeOrmModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
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
        }),
      ],
    };
  }
}
