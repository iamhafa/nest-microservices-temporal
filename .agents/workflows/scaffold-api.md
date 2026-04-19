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
- Inject the target microservice's `ClientProxy` and pass the payload via `this.clientProxy.send()`.

**3. Handle Message at Target Service (`apps/<target-service>`)**
- Navigate to `apps/<target-service>/src/`.
- Define the RabbitMQ handler in `<target-service>.controller.ts` using `@MessagePattern('message-pattern')`.
- Validate the incoming payload and delegate logic to the Service.

**4. Implement Core Logic, Temporal & Database (`apps/<target-service>`)**
- **For direct DB updates:** Add methods in `<target-service>.service.ts` to interact with the repository. Update TypeORM `Entity` in `apps/<target-service>/src/entity/`.
- **For workflow orchestration:** If the feature requires distributed transactions (Saga), inject the Temporal `WorkflowClient` and start the workflow. Create Temporal Activities inside `apps/<target-service>/src/activity/` to perform DB updates.

> 💡 **AI Instruction:** When generating a feature, present your plan to the user mirroring these 4 steps explicitly before generating the code to confirm the approach.
