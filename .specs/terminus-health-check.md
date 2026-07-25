# Implementation Plan: Terminus Health Checks (`@nestjs/terminus`)

## Overview

Implement comprehensive health check monitoring across the NestJS monorepo using `@nestjs/terminus`. This will enable liveness and readiness probes for API Gateway and all microservices (`order-service`, `inventory-service`, `product-service`, `shipping-service`, `user-service`, `payment-service`).

---

## Architecture & Strategy

### 1. Package Installation

Install `@nestjs/terminus` (and `@nestjs/axios` if HTTP pinging is required).

### 2. API Gateway Health Check (`/health`)

Create `HealthModule` and `HealthController` in `apps/api-gateway/src/modules/health/`:

- **Endpoint**: `GET /health` (Exempt from JWT Auth and Throttling rate limits).
- **Health Indicators**:
  - **Memory**: `MemoryHealthIndicator` (checks heap & RSS memory threshold, e.g. < 300MB).
  - **Redis / Cache**: Custom Redis ping check.
  - **RabbitMQ Broker**: Microservice / Custom RabbitMQ connection check.
  - **Microservices Liveness**: Ping microservices via RabbitMQ RPC (`order.health`, `inventory.health`, `product.health`, `shipping.health`, `user.health`) to ensure microservice workers are active.

### 3. Microservice Health RPC Handlers & DB Health Indicators

- Add health RPC handlers in each microservice (`@RabbitRPC({ routingKey: '[domain].health' })`).
- Each microservice verifies its own TypeORM database connection (if applicable) and returns status `{ status: 'ok', service: '[service-name]' }`.

---

## User Review Required

> [!IMPORTANT]
> **Health Check Endpoint Access**:
> The `/health` endpoint in API Gateway will be public (decorated with `@Public()`) so Kubernetes / Docker / Monitoring tools (e.g. Prometheus, Datadog) can ping it without authentication.

---

## Proposed Changes

### Dependencies

- Install `@nestjs/terminus` via `pnpm add @nestjs/terminus`

### Shared / Contracts (`libs/messaging`)

- Add `HEALTH` routing keys to domain enums:
  - `OrderRoutingKey.HEALTH = 'order.health'`
  - `InventoryRoutingKey.HEALTH = 'inventory.health'`
  - `ProductRoutingKey.HEALTH = 'product.health'`
  - `ShippingRoutingKey.HEALTH = 'shipping.health'`
  - `UserRoutingKey.HEALTH = 'user.health'`

### API Gateway (`apps/api-gateway`)

- [NEW] [health.controller.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/api-gateway/src/modules/health/health.controller.ts)
- [NEW] [health.module.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/api-gateway/src/modules/health/health.module.ts)
- [MODIFY] [api-gateway.module.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/api-gateway/src/api-gateway.module.ts)

### Microservices (`apps/<service>`)

Add health RPC handlers in:

- [inventory-service.service.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/inventory-service/src/inventory-service.service.ts)
- [order-service.service.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/order-service/src/order-service.service.ts)
- [product.service.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/product-service/src/modules/product/product.service.ts)
- [shipping-service.service.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/shipping-service/src/shipping-service.service.ts)
- [user-service.service.ts](file:///Users/iamhafa/Workspace/NEST/nest-microservices-temporal/apps/user-service/src/user-service.service.ts)

---

## Verification Plan

### Automated Build Verification

1. Run `npm run build` to verify clean compilation.
2. Run unit / E2E tests if available.

### Manual Verification

1. Start services and send HTTP GET request to `http://localhost:3000/health`.
2. Inspect the JSON response format from Terminus (`status: 'ok'`, details of memory, Redis, and microservices).
