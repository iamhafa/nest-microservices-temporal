---
name: env-conventions
description: Rules and conventions for environment variables and configuration management across the monorepo
---

# Environment Variables & Configuration Conventions

These rules govern how environment variables and configuration properties are organized, named, accessed, and validated across all applications (`apps/`) and shared libraries (`libs/`) in this monorepo.

---

## 📍 1. File Location & Scope

1. **Centralized Root Scope Only**: All environment variables for local development MUST be stored in the single root file `/.env` and documented in `/.env.example`.
2. **No Per-Service `.env` Files**: NEVER create `.env` or `.env.example` files inside `apps/<service>/` subdirectories.
3. **Mandatory `.env.example` Synchronization**: Whenever adding or modifying an environment variable, update `/.env.example` with a description comment.

---

## 🏷️ 2. Naming Conventions

1. **Shared Infrastructure Variables**: Use clear `UPPER_SNAKE_CASE` names for shared resources.
   - Examples: `NODE_ENV`, `RABBITMQ_URL`, `REDIS_URL`, `JWT_SECRET`, `TEMPORAL_HOST`, `LOKI_URL`
2. **Service-Specific Database Variables**: Prefix database names with the service domain name:
   - Examples: `ORDER_DB_NAME`, `INVENTORY_DB_NAME`, `PRODUCT_DB_NAME`, `USER_DB_NAME`, `SHIPPING_DB_NAME`, `PAYMENT_DB_NAME`
3. **Third-Party Integration Keys**: Prefix with the provider or domain:
   - Examples: `STRIPE_SECRET_KEY`, `STRIPE_TIMEOUT`

---

## 🛡️ 3. Access & Validation Rules

1. **No Raw `process.env` in Logic**: Never access `process.env.VARIABLE_NAME` directly inside services, controllers, or handlers. Always inject NestJS `ConfigService` (or `EnvironmentService` from `@libs/common`).
2. **Fail-Fast for Mandatory Keys (`getOrThrow`)**:
   - For required credentials and endpoints (DB, RabbitMQ, JWT, Redis), use `configService.getOrThrow<T>('KEY_NAME')` during bootstrap so the app fails immediately if a key is missing.
3. **Explicit Fallbacks for Optional Keys**:
   - For optional keys, use `configService.get<T>('KEY_NAME', fallbackValue)` and always provide an explicit default value.

---

## ⚙️ 4. Module Initialization

1. Initialize `ConfigModule` at the root module level (`apps/<service>/*.module.ts`) cleanly:
   ```typescript
   ConfigModule.forRoot();
   ```
2. By default, NestJS `ConfigModule` loads `/.env` at the root scope.
