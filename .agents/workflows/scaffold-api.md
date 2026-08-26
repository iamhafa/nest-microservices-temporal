---
description: scaffold a highly consistent cross-service feature (End-to-End flow) from API Gateway to the Database
---

# Scaffolding an API Feature (End-to-End)

When asked to "create a feature" or scaffold an API (e.g., "Create a Category feature"), follow this exact sequence to ensure no layer is missed spanning from the `api-gateway` to the target microservice.

**1. Define Data Contracts (`libs/contract`)**
- Navigate to `libs/contract/src/<domain>/dto/`.
- Create Request / Response DTOs.
- Re-export them in `libs/contract/src/<domain>/dto/index.ts`.

**2. Scaffold API Gateway (`apps/api-gateway`)**
- Navigate to `apps/api-gateway/src/modules/<domain>/`.
- Define the endpoint (`@Post`, `@Get`, etc.) in the Controller.
- Mount `@ApiOperation`, `@ApiBody`, and target Response DTOs using `@ApiResponse`.
- Inject `RmqPublisherService` and call `this.rmqPublisher.request('routing-key', payload)` to delegate to the target service.

**3. Handle Message at Target Service (`apps/<target-service>`)**
- Navigate to `apps/<target-service>/src/`.
- Microservices **MUST NOT** have controller files. Define the RabbitMQ handler directly in `<target-service>.service.ts` using the `@RabbitRPC` decorator from `@golevelup/nestjs-rabbitmq`.
- Inject the `@RabbitPayload` in the method argument, validate the payload, and perform business logic.

**4. Implement Core Logic, Temporal & Database (`apps/<target-service>`)**
- **For direct DB updates:** Add methods inside the service to interact with the TypeORM repository. Update TypeORM `Entity` in `apps/<target-service>/src/entity/` (hoặc trong `modules/<feature>/entity/` với service phức tạp như `product-service`).
- **For complex services (e.g. `product-service`):** Tổ chức theo feature modules trong `apps/<target-service>/src/modules/<feature>/` (module + service + repository + entity). Business logic nằm trong service, gọi repository trực tiếp. (LƯU Ý: repo hiện KHÔNG dùng CQRS/`CommandBus`/`QueryBus` — đừng scaffold theo CQRS.)
- **For workflow orchestration:** If the feature requires distributed transactions (Saga), inject `TemporalService` and call `this.temporalService.startWorkflow()`. Create Temporal Activities inside `apps/<target-service>/src/activity/` to perform database modifications.


> 💡 **AI Instruction:** When generating a feature, present your plan to the user mirroring these 4 steps explicitly before generating the code to confirm the approach.

## ✅ Verification Gates

Before presenting the final code to the user and considering the API scaffolding complete, YOU MUST VERIFY:
- [ ] Are Request and Response DTOs exported correctly in `libs/contract`?
- [ ] Does the Gateway Controller use `RmqPublisherService` for communication?
- [ ] Does the Target Service use `@RabbitRPC` and strictly avoid `*.controller.ts` files?
- [ ] Are business logic, database queries, and Temporal workflows isolated properly inside the Target Service?
