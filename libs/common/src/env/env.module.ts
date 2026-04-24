import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'lodash';
import { cwd } from 'node:process';
import { EnvService } from './env.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(cwd(), '.env')],
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
