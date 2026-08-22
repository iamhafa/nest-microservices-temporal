import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  private readonly currentEnv: string;

  constructor(private readonly configService: ConfigService) {
    this.currentEnv = this.configService.get<string>('NODE_ENV', 'development');
  }

  isProduction(): boolean {
    return this.currentEnv === 'production';
  }

  isDevelopment(): boolean {
    return this.currentEnv === 'development';
  }
}
