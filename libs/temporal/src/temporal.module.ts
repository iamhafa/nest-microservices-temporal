import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TemporalModule, TemporalOptions } from 'nestjs-temporal-core';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [],
  exports: [],
})
export class SharedTemporalModule {
  static forRoot(options?: TemporalOptions): DynamicModule {
    return TemporalModule.registerAsync({
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
