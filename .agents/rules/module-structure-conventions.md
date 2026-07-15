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

## 🏗 Module Structure & Interfaces

Each business feature or capability MUST be organized as a cohesive module. We use the standard Controller -> Service pattern.

1. **Folder Structure**:
   ```
   apps/<service-name>/src/<feature>/
   ├── <feature>.controller.ts      ← HTTP / RabbitMQ message handlers
   ├── <feature>.module.ts          ← Module definition
   ├── <feature>.service.ts         ← Business logic implementation
   ├── dto/                         ← Request/Response DTOs (if specific to this service)
   │   ├── create-<feature>.dto.ts
   │   └── update-<feature>.dto.ts
   └── interfaces/                  ← Interfaces definitions
       └── <feature>-service.interface.ts
   ```

2. **Interface-Based Services**:
   - Each Service MUST have a corresponding Interface defined in the `interfaces/` folder (e.g., `<feature>-service.interface.ts`).
   - The Interface defines the exact parameters, data types, and return types for the service methods.
   - The Service class MUST `implements` this interface.
   
   Example:
   ```typescript
   // interfaces/audio-service.interface.ts
   export interface IAudioService {
     generateAudio(dto: TextToSpeechDto): Promise<AudioResponse>;
   }

   // audio.service.ts
   @Injectable()
   export class AudioService implements IAudioService {
     // ...
   }
   ```

## 📝 Service Logging & Lifecycle

1. **Logger Initialization**: Every Service MUST instantiate its own logger using the `Logger` class from `@nestjs/common`.
   ```typescript
   private readonly logger = new Logger(AudioService.name);
   ```

2. **Execution Tracking**:
   - Every public method in the Service MUST begin with a log statement indicating that execution has started.
   - Every public method MUST end with a log statement indicating successful completion.
   ```typescript
   async generateAudio(dto: TextToSpeechDto): Promise<AudioResponse> {
     this.logger.log(`[generateAudio] Started with text length: ${dto.text.length}`);
     // ... processing ...
     this.logger.log(`[generateAudio] Completed successfully.`);
     return result;
   }
   ```

## 🌐 External Services & Error Handling

When interacting with external APIs or 3rd-party libraries (e.g., Stripe, ElevenLabs), follow these strict rules:

1. **Try-Catch Blocks**: All external calls MUST be wrapped in a `try...catch` block.
2. **Instance Checking**: In the `catch` block, verify if the error is an instance of the external service's specific error class.
3. **Log Details**: Log the external error details (status code, type, request ID, message, etc.) for debugging.
4. **AppException Translation**: Do NOT throw the raw external error. Instead, map it to our internal `AppException` (imported from `@libs/common/filter/exception/app-exception`) with an appropriate error code (e.g., `PaymentErrorCode`, `SystemErrorCode`) and message.

   Example:
   ```typescript
   import { AppException } from '@libs/common/filter/exception/app-exception';
   import { PaymentErrorCode, SystemErrorCode } from '@libs/common/filter/exception/error-codes'; // Example path

   async processPayment(amount: number) {
     this.logger.log(`[processPayment] Started for amount: ${amount}`);
     try {
       const result = await this.stripe.charges.create({ amount, currency: 'usd' });
       this.logger.log(`[processPayment] Completed successfully.`);
       return result;
     } catch (error) {
       if (error instanceof Stripe.errors.StripeError) {
         this.logger.error(`[processPayment] Stripe Error: ${error.type} - ${error.code} - ${error.message}`);
         // Handle specific error types
         if (error.type === 'StripeCardError') {
           throw new AppException({
             code: PaymentErrorCode.CARD_DECLINED, // Example code
             message: 'Your card was declined. Please try another payment method.',
             status: HttpStatus.BAD_REQUEST,
           });
         }
       }
       
       this.logger.error(`[processPayment] Unexpected external error: ${error.message}`, error.stack);
       throw new AppException({
         code: SystemErrorCode.INTERNAL_SERVER_ERROR, // Example code
         message: 'An unexpected error occurred while processing the payment.',
         status: HttpStatus.INTERNAL_SERVER_ERROR,
       });
     }
   }
   ```
