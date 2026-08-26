---
trigger: always_on
description: Monorepo layout, service responsibilities, and shared libraries structure
---

# Project Structure — NestJS Monorepo

## 📂 Top-Level Layout

```
├── apps/                    ← Microservices (each is a standalone NestJS app)
├── libs/                    ← Shared libraries across services
├── docker-compose.yml       ← Infrastructure services (PostgreSQL, Temporal, RabbitMQ...)
├── nest-cli.json            ← Monorepo project definitions
└── package.json             ← Shared dependencies & scripts
```

## 🚀 Services (`apps/`)

| Service                  | Vai trò                                                           | Có DB | Có Activity |
| ------------------------ | ----------------------------------------------------------------- | ----- | ----------- |
| `api-gateway`            | HTTP entrypoint, route requests to internal services via RabbitMQ | ❌    | ❌          |
| `order-service`          | Quản lý đơn hàng (CRUD, status updates)                           | ✅    | ✅          |
| `inventory-service`      | Quản lý tồn kho (reserve, confirm, release, restore)              | ✅    | ✅          |
| `payment-service`        | Xử lý thanh toán (charge, refund)                                 | ✅    | ✅          |
| `shipping-service`       | Tạo và quản lý vận chuyển                                         | ✅    | ✅          |
| `product-service`        | Quản lý sản phẩm (CRUD, validation)                               | ✅    | ✅          |
| `user-service`           | Quản lý/xác thực người dùng                                       | ✅    | ❌          |

| `orchestrator-worker`    | Chạy Temporal workflows (KHÔNG phải HTTP service)                 | ❌    | ❌          |

### Standard Service Structure

```
apps/<service-name>/src/
├── main.ts                           ← Bootstrap & connect to RabbitMQ
├── <service-name>.module.ts          ← Root module
├── <service-name>.controller.ts      ← RabbitMQ message handler (nếu có)
├── <service-name>.service.ts         ← Business logic (nếu có)
├── activity/                         ← Temporal activity implementations (nếu có)
├── entity/                           ← TypeORM entities (nếu có DB - hoặc trong modules/)
├── repository/                       ← Data access layer (nếu có DB - hoặc trong modules/)
└── modules/                          ← Feature modules (dành cho service phức tạp như product-service)
```

### API Gateway Structure

```
apps/api-gateway/src/
├── main.ts                           ← HTTP server bootstrap
├── api-gateway.module.ts             ← Root module
└── modules/                          ← Feature modules (order, product, etc.)
    └── <feature>/
        ├── <feature>.controller.ts   ← REST endpoints
        ├── <feature>.module.ts
        └── <feature>.service.ts      ← Proxy to internal services via RabbitMQ
```

## 📚 Shared Libraries (`libs/`)

| Library    | Path alias       | Mục đích                                                      |
| ---------- | ---------------- | ------------------------------------------------------------- |
| `common`   | `@libs/common`   | Shared enums, logger, utilities, decorators                   |
| `contract` | `@libs/contract` | DTOs (trong `/dto`) và enums (trong `/enum`) dùng chung giữa services |
| `temporal` | `@libs/temporal` | Activity interfaces, task queue enums, shared Temporal module |
| `auth`     | `@libs/auth`     | JWT Authentication guard, Roles authorization guard, decorators |

### Key Rules

- **Strict Service Isolation**: Services are **NOT ALLOWED** to import files from other services. They may only import from shared `libs` to ensure complete independence between services.
- **DTOs** shared giữa services → đặt trong `libs/contract/src/<domain>/dto/` và import từ `@libs/contract/<domain>/dto`.
- **Enums** shared → đặt trong `libs/contract/src/<domain>/enum/` và import từ `@libs/contract/<domain>/enum` (hoặc `libs/common/src/enum/`).
- **Activity interfaces** → đặt trong `libs/temporal/src/activity/interface/`.
- Code chỉ dùng bởi 1 service → giữ trong `apps/<service>/src/`, KHÔNG đưa vào `libs/`.

## 🔗 Communication Flow

```mermaid
flowchart TD
    Client -->|HTTP| APIGW[API Gateway]
    APIGW -->|RabbitMQ| Services[Services]
    Services <--> Orchestrator[Orchestrator Worker<br/>Temporal Workflows]
    Orchestrator <--> Activities[Services<br/>via Temporal Activities]
```

- **Client ↔ API Gateway**: HTTP/REST
- **API Gateway ↔ Services**: RabbitMQ (request/response pattern)
- **Orchestrator ↔ Services**: Temporal Activities (each service has its own task queue)

## 🛑 Rationalizations (Anti-patterns)

- **"I'll just add a Controller in the microservice for easier testing."**
  - **Rebuttal**: NO. Microservices only communicate via RabbitMQ RPC (`@RabbitRPC`). Controllers are ONLY allowed in the `api-gateway`.
- **"I will import an entity or service directly from `apps/another-service/src`."**
  - **Rebuttal**: NO. Strict service isolation is enforced. Services can only import from shared libraries (`libs/*`). Data sharing must be done via DTOs and RabbitMQ.

## 🚩 Red Flags

- Seeing `import { ... } from '../../another-service/...'` in any file.
- Any file ending in `.controller.ts` inside `apps/` (other than `apps/api-gateway/`).
- Direct HTTP requests (`axios`, `HttpModule`) between microservices instead of RabbitMQ/Temporal.

## ✅ Verification Gates

Before completing an architecture setup or feature scaffolding, verify:
- [ ] Are all cross-service DTOs defined inside `libs/contract`?
- [ ] Is the communication flow strictly: API Gateway -> RabbitMQ -> Microservice -> Temporal (if needed)?
