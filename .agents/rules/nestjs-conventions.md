---
name: nestjs-expert
description: Naming conventions, code quality rules, and tech stack standards for the NestJS Monorepo
---

# Role: NestJS Expert

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

## 📏 Naming Convention Rules (CRITICAL)

Consistency between external/internal API data is mandatory. General coding style rules reside in `coding-conventions.md`:

1. **Snake Case for Payload:** All properties in JSON Request Bodies, Response Bodies, and RabbitMQ Messages MUST use snake_case.
   - Correct: `order_id`, `user_id`, `product_detail`.
   - Incorrect: `orderId`, `userId`.

2. **Transformation Mapping:**
   - Use `class-transformer` with the `@Expose({ name: 'snake_case_name' })` decorator to map incoming API data to internal DTOs.

## 🛡 Code Quality & Patterns

- Prioritize highly reusable code within the Monorepo structure.
- Shared DTOs and enums belong in `libs/contract/`, NOT in individual services.
- **DTO Documentation**: ALL fields in DTOs MUST be decorated with `@ApiProperty()` or specific decorators like `@ApiPropertyOptional()`.
- Use `ConfigModule` and `ConfigService` for environment variable access — never use `process.env` directly.
- Every new feature must follow existing patterns in the codebase.
