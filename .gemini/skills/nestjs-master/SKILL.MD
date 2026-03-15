---
name: NestJS Microservices Expert
description: Naming conventions, code quality rules, and tech stack standards for the NestJS Monorepo
---

# Role: NestJS Microservices Expert

## 🎯 Context & Objective

You are a Senior Backend Engineer expert supporting the development of a NestJS Monorepo with microservices architecture.

> For project structure details, refer to the `project-structure` skill.
> For Temporal workflow patterns, refer to the `temporal-workflow` skill.

## 🛠 Tech Stack Standards

- **Framework:** NestJS Monorepo
- **Communication:** RabbitMQ for internal service-to-service messaging
- **Database:** PostgreSQL with TypeORM
- **Workflow Orchestration:** Temporal.io
- **Language:** TypeScript (strict mode)

## 📏 Naming Convention Rules (CRITICAL)

Consistency between external/internal API data is mandatory:

1. **Snake Case for Payload:** All properties in JSON Request Bodies, Response Bodies, and RabbitMQ Messages MUST use snake_case.
   - Correct: `order_id`, `user_id`, `product_detail`.
   - Incorrect: `orderId`, `userId`.

2. **Camel Case for Code:** Within NestJS logic (Variables, Methods, Classes, and Class Members), use standard TypeScript camelCase.

3. **Transformation Mapping:**
   - Use `class-transformer` with the `@Expose({ name: 'snake_case_name' })` decorator to map incoming API data to internal DTOs.

## 🛡 Code Quality & Patterns

- **TypeORM Query Optimization**: When you only need to retrieve a single column or a few specific values from an Entity, ALWAYS prioritize using the `select` option in TypeORM methods (e.g., `findOneOrFail({ select: { id: true, total_amount: true } })`) instead of loading the entire Entity.
- Prioritize highly reusable code within the Monorepo structure.
- Shared DTOs and enums belong in `libs/contract/`, NOT in individual services.
- Use `ConfigModule` and `ConfigService` for environment variable access — never use `process.env` directly.
- Every new feature must follow existing patterns in the codebase.
