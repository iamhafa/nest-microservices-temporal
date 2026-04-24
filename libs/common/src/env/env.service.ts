import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService) {}

  isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }
}
