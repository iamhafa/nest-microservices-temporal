# Specification: Distributed Rate Limiting with Redis

## 🎯 Overview

This specification details the architecture, configuration, and implementation of centralized rate limiting across all API Gateway instances using `@nestjs-redis/throttler-storage` and Redis.

---

## ❓ Rationale & Problem Statement

### 💥 In-Memory Throttler Limitations (Default)
When deploying `api-gateway` in a clustered or multi-pod environment (e.g., Kubernetes HPA with 5 instances):
- Default NestJS `ThrottlerModule` stores request counters in local node memory (RAM).
- Request rate counting is isolated to each pod. A client could send 30 requests to Pod A, 30 to Pod B, and 30 to Pod C, effectively bypassing the intended rate limit (allowing 90 requests instead of 30).

### 🚀 Distributed Throttling via Redis
Using `@nestjs-redis/throttler-storage` with Redis provides:
1. **Single Source of Truth**: A shared atomic counter store across all API Gateway instances.
2. **Atomic Counter Operations**: Prevents race conditions during high-concurrency traffic bursts.
3. **Exact Global Limit Enforcement**: Guarantees strict rate limit enforcement regardless of the number of running API Gateway pods.

---

## 📦 Required Dependencies

```bash
pnpm add @nestjs-redis/throttler-storage @nestjs-redis/client redis
```

---

## 🛠️ Implementation Guide

### `apps/api-gateway/src/api-gateway.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { RedisModule, RedisToken } from '@nestjs-redis/client';
import { RedisThrottlerStorage } from '@nestjs-redis/throttler-storage';
import { Redis } from 'redis';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // 1. Initialize Redis Client Connection
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        options: {
          url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
    }),
    // 2. Configure ThrottlerModule with RedisThrottlerStorage
    ThrottlerModule.forRootAsync({
      inject: [RedisToken(), ConfigService],
      useFactory: (redisClient: Redis, config: ConfigService) => ({
        throttlers: [
          {
            ttl: seconds(config.get<number>('RATE_LIMIT_TTL', 60)),
            limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS_PER_IP', 30),
          },
        ],
        storage: new RedisThrottlerStorage(redisClient),
      }),
    }),
  ],
})
export class ApiGatewayModule {}
```

---

## 🛡️ Verification & Testing

1. Start Redis: `docker-compose up -d redis`
2. Run gateway service: `pnpm run start:dev api-gateway`
3. Send requests exceeding `RATE_LIMIT_MAX_REQUESTS_PER_IP` within `RATE_LIMIT_TTL`.
4. Verify HTTP `429 Too Many Requests` response is returned consistently across all Gateway instances.
