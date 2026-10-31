---
name: nestjs-module-expert
description: Module structure, coding conventions, and tech stack standards for the NestJS Monorepo
---

# Role: NestJS Module Expert

## 🎯 Context & Objective

You are a Senior Backend Engineer expert supporting the development of a NestJS Monorepo with microservices architecture.

> For project structure details, refer to the `project-structure` skill.
> For Temporal workflow patterns, refer to the `temporal-workflow` skill.
> For database and TypeORM operations, refer to the `typeorm-expert` skill.
> For general naming styling and coding practices, refer to the `coding-conventions.md` rule.

## 🛠 Tech Stack Standards

- **Framework:** NestJS Monorepo
- **Communication:** RabbitMQ for internal service-to-service messaging
- **Database:** PostgreSQL with TypeORM
- **Workflow Orchestration:** Temporal.io
- **Language:** TypeScript (strict mode)
- **Context Management:** `nestjs-cls` for shared context (correlation IDs) across services

## 📏 Naming Convention Rules (CRITICAL)

Consistency between external/internal API data is mandatory. General coding style rules reside in `coding-conventions.md`:

1. **Snake Case for Payload:** All properties in JSON Request Bodies, Response Bodies, and RabbitMQ Messages MUST use snake_case.
   - Correct: `order_id`, `user_id`, `product_detail`.
   - Incorrect: `orderId`, `userId`.

2. **Transformation Mapping:**
   - Prefer defining properties in snake_case directly in DTOs to match the payload.
   - If internal property names must differ from the payload, use `class-transformer` with the `@Expose({ name: 'snake_case_name' })` decorator to map incoming/outgoing data.

## 🛡 Code Quality & Patterns

- Prioritize highly reusable code within the Monorepo structure.
- Shared DTOs and enums belong in `libs/contract/`, NOT in individual services.
- **DTO Documentation**: ALL fields in DTOs MUST be decorated with `@ApiProperty()` or specific decorators like `@ApiPropertyOptional()`.
- **DTO Optional Properties**: All properties decorated with `@IsOptional()` MUST use the `?:` operator to denote that the property can be undefined. Example: `description?: string;`.
- Use `ConfigModule` and `ConfigService` for environment variable access — never use `process.env` directly.
- Every new feature must follow existing patterns in the codebase.

## 🏗 Module Structure & Service Organization

Each business capability is organized as a cohesive NestJS module.

### 1. API Gateway Structure (`apps/api-gateway`)

```
apps/api-gateway/src/modules/<feature>/
├── <feature>.controller.ts      ← REST endpoints (Swagger, JWT, Rate-limit)
├── <feature>.module.ts          ← Module definition
└── <feature>.service.ts         ← Proxies requests to microservices via RmqPublisherService
```

### 2. Standard Microservice Structure (`apps/<service-name>`)

```
apps/<service-name>/src/
├── main.ts                      ← Bootstrap (RabbitMQ consumer, global filters/interceptors)
├── <service-name>.module.ts     ← Root module (TypeORM, SharedRabbitMQModule, SharedClsModule)
├── <service-name>.service.ts    ← Business logic & @RabbitRPC message handlers
├── activity/                    ← Temporal Activities (nếu có)
├── entity/                      ← TypeORM entities
└── repository/                  ← TypeORM repositories (nếu có)
```

### 3. Complex Microservice Structure (e.g. `product-service`)

```
apps/product-service/src/modules/<feature>/
├── entity/                      ← TypeORM entities for this feature
├── repository/                  ← Custom repository for data access
├── <feature>.service.ts         ← Business logic & @RabbitRPC message handlers
└── <feature>.module.ts          ← Feature module definition
```

> ⚠️ **LƯU Ý:** Microservices KHÔNG dùng `.controller.ts`. Tất cả RPC message handlers được định nghĩa trực tiếp trong `.service.ts` bằng `@RabbitRPC`.
> Dự án KHÔNG sử dụng CQRS (`CommandBus`/`QueryBus`), Service gọi Repository trực tiếp.

## 📝 Service Logging

1. **Logger Initialization**: Every Service instantiates its own logger using the `Logger` class from `@nestjs/common`:

   ```typescript
   private readonly logger = new Logger(ProductService.name);
   ```

2. **Execution Tracking**:
   - Log execution start and key checkpoints using `this.logger.log(...)` or `this.logger.debug(...)`.
   - Log errors with stack trace using `this.logger.error(...)`.
   - Logs automatically carry `correlationId` and `serviceName` via `SharedLoggerModule` & `nestjs-pino`.

## 🌐 External Services & Error Handling

When interacting with external APIs or 3rd-party libraries (e.g., Stripe):

1. **Try-Catch Blocks**: All external calls MUST be wrapped in a `try...catch` block.
2. **Circuit Breaker**: Use `cockatiel` circuit breaker for third-party HTTP calls (see `resilience-conventions.md`).
3. **Log Details**: Log the external error details for debugging.
4. **Standard NestJS Exception with Error Code**: Do NOT throw raw third-party errors. Map them to standard NestJS exceptions with a domain error code:

   Example:

   ```typescript
   import { PaymentErrorCode } from '@libs/contract/payment/error/payment-code.error';
   import { BadRequestException, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
   import { BrokenCircuitError } from 'cockatiel';

   try {
     const paymentIntent = await this.circuitBreaker.execute(() => this.stripeClient.paymentIntents.create(...));
     return paymentIntent;
   } catch (error) {
     if (error instanceof BrokenCircuitError) {
       throw new ServiceUnavailableException('Payment service is currently unavailable. Please try again later.', {
         errorCode: PaymentErrorCode.CIRCUIT_BREAKER_OPEN,
       });
     }
     if (error instanceof Stripe.errors.StripeCardError) {
       throw new BadRequestException(error.message, {
         errorCode: PaymentErrorCode.CARD_DECLINED,
       });
     }
     this.logger.error(`Stripe unexpected error: ${error.message}`, error.stack);
     throw new InternalServerErrorException('Unexpected error occurred while processing payment', {
       errorCode: PaymentErrorCode.INTERNAL_SERVER_ERROR,
     });
   }
   ```
