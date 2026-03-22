---
name: feature-scaffold
description: Standard workflow and guide for scaffolding a highly consistent cross-service feature (End-to-End flow) from API Gateway to the Database.
---

# Role: Feature Scaffolding Expert

## 🎯 Context & Objective

You are a Backend Architect providing a consistent, step-by-step checklist to scaffold a new cross-service feature in the NestJS Monorepo.

When asked to "create a feature" (e.g., "Create a Category feature"), ALWAYS follow this exact sequence to ensure no layer is missed spanning from the `api-gateway` to the target microservice, including its Temporal logic and Database.

## 🛠 Scaffolding Workflow (Step-by-Step)

When implementing a new feature, go through the following steps sequentially.

### 1. Define Data Contracts (`libs/contract`)

The first step is always to establish the input and output shapes to be used by all services.

- Navigate to `libs/contract/src/<domain>/dto/`.
- Create Request / Response DTOs.
- **Rule:** Use `@ApiProperty()` for Swagger, use `class-validator` rules, and use `@Expose({ name: 'snake_case' })` from `class-transformer` for standard snake_case payloads.

### 2. Scaffold API Gateway (`apps/api-gateway`)

Create the public-facing entry point that clients will call.

- Navigate to `apps/api-gateway/src/modules/<domain>/`.
- Define the endpoint (`@Post`, `@Get`, etc.) in the Controller.
- Mount `@ApiOperation`, `@ApiBody`, and target Response DTOs using `@ApiResponse`.
- Inject the target microservice's `ClientProxy`.
- **Rule (Payload Mapping):** For update or action endpoints (e.g., `PATCH`, `POST`), prioritize placing the resource `id` inside the `@Body` DTO instead of using `@Param('id')` in the URL. Since RabbitMQ's `.send()` only accepts a single `data` payload, passing the ID directly within the DTO avoids having to manually merge parameters before forwarding the request to the microservice.
- Pass the request payload via RabbitMQ using `this.clientProxy.send('message-pattern', payload)`. Ensure you handle the `Observable` properly (e.g. `firstValueFrom`).

### 3. Handle Message at Target Service (`apps/<target-service>`)

Receive the RabbitMQ message inside the internal microservice.

- Navigate to `apps/<target-service>/src/`.
- Define the RabbitMQ handler in `<target-service>.controller.ts` using `@MessagePattern('message-pattern')`.
- Validate the incoming payload if needed (usually handled globally, but good to ensure DTO typing).
- Delegate the logic to the Service layer (`<target-service>.service.ts`).

### 4. Implement Core Logic, Temporal & Database (`apps/<target-service>`)

Implement the actual business logic, workflow execution, or database interaction.

- **For direct DB updates:** Add methods in `<target-service>.service.ts` to interact with `Repository` or `DataSource` directly. Create or update TypeORM `Entity` in `apps/<target-service>/src/entity/`.
- **For workflow orchestration:** If the feature requires distributed transactions (Saga), inject the Temporal `WorkflowClient` and start the workflow. Do NOT access the database directly here; instead, create Temporal Activities inside `apps/<target-service>/src/activity/` to perform the DB updates.
- **Rules:** Follow existing standards in `typeorm-expert` and `temporal-workflow` skills.

---

## 🌟 Concrete Example: Product Creation Flow

_If asked to "Create Product API"_

1. **Contracts (`libs/contract/src/product/dto/`)**:
   - `CreateProductRequestDto`: `{ name: string, price: number }`
   - `CreateProductResponseDto`: `{ id: string, name: string }`
2. **Gateway (`apps/api-gateway/src/modules/product/`)**:
   - `ProductController.ts`: Defines `@Post()`, takes `CreateProductRequestDto`, sends message `'create-product'` to RabbitMQ.
3. **Message Handler (`apps/product-service/src/`)**:
   - `ProductController.ts`: Listens to `@MessagePattern('create-product')`.
   - `ProductService.ts`: Contains the business logic for creating the product.
4. **Core Target Logic (`apps/product-service/src/`)**:
   - `ProductEntity.ts`: Defines TypeORM columns.
   - Database operations are invoked directly via Service layer (if no Temporal orchestrator) or via Activity (e.g. `ProductActivity.ts`) if Saga is required.

---

> 💡 **AI Instruction:** When generating a feature, present your plan to the user mirroring these 4 steps explicitly before generating the code to confirm the approach.
