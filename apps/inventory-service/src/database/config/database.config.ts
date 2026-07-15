import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { InventoryEntity } from '../../entity/inventory.entity';

ConfigModule.forRoot({ isGlobal: true });
const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.getOrThrow<string>('DB_HOST'),
  port: configService.getOrThrow<number>('DB_PORT'),
  username: configService.getOrThrow<string>('DB_USER'),
  password: configService.getOrThrow<string>('DB_PASS'),
  database: configService.getOrThrow<string>('DB_NAME'),
  entities: [InventoryEntity],
  migrations: [__dirname + '../migration/*{.ts,.js}'],
  synchronize: false,
  invalidWhereValuesBehavior: {
    undefined: 'throw',
    null: 'throw',
  },
};
