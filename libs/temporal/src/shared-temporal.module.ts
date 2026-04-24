import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';

@Module({})
export class SharedTemporalModule {
  static forRoot(options?: TemporalOptions): DynamicModule {
    return TemporalModule.registerAsync({
      isGlobal: true, // allow child module can use this module from parent module
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TemporalOptions => ({
        ...options,
        connection: {
          address: config.getOrThrow<string>('TEMPORAL_HOST'),
          namespace: config.getOrThrow<string>('TEMPORAL_NAMESPACE'),
        },
      }),
    });
  }
}
