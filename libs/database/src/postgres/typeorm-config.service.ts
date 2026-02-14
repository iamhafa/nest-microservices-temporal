import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(TypeOrmConfigService.name);

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const database: string = this.configService.getOrThrow<string>('DB_NAME');
    const host: string = this.configService.getOrThrow<string>('DB_HOST');
    const port: number = this.configService.getOrThrow<number>('DB_PORT');

    this.logger.verbose(`Connecting to database [${database}] on host [${host}] via port [${port}]...`);

    return {
      type: 'postgres',
      host: host,
      database: database,
      port: port,
      username: this.configService.getOrThrow<string>('DB_USERNAME'),
      password: this.configService.getOrThrow<string>('DB_PASSWORD'),
      autoLoadEntities: true,
      synchronize: true, // disable when production
    };
  }
}
