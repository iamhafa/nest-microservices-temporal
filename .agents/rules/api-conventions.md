---
name: api-conventions
description: Conventions for API Gateways, DTOs, Swagger documentation, and RabbitMQ message payload naming.
---

# API & Contract Conventions

When writing or modifying code in this workspace, ALWAYS adhere to the following rules for API Gateways and Data Contracts (DTOs):

1. **DTOs (`libs/contract`)**:
   - Always use `@ApiProperty()` on fields for Swagger documentation.
   - Always use `class-validator` decorators (e.g., `@IsString()`, `@IsNotEmpty()`) for strict validation.
   - Define fields directly in `snake_case` (e.g., `product_id`). Use `@Expose({ name: 'snake_case' })` only if internal property names must differ from the payload structure.

2. **API Documentation (Swagger/OpenAPI) [MANDATORY]**:
   - Every controller method in `api-gateway` MUST have `@ApiOperation({ summary: 'Short description' })`.
   - Use specific response decorators for ALL endpoints:
     - `@ApiOkResponse()` or `@ApiCreatedResponse()` for success.
     - `@ApiAcceptedResponse()` for async operations (like starting a workflow).
     - `@ApiUnprocessableEntityResponse({ description: 'Validation failed' })` for endpoints using DTO validation.
     - `@ApiNotFoundResponse({ description: 'Resource not found' })` where applicable.
     - `@ApiInternalServerErrorResponse({ description: 'Internal server error' })` for unexpected failures.

3. **API Gateway Endpoints (`apps/api-gateway`)**:
   - For update or action endpoints (e.g., `PATCH`, `POST`), **place the resource `id` inside the `@Body` DTO** rather than using `@Param('id')` in the URL whenever possible. This allows you to forward a single payload via RabbitMQ without manual merging.
   - Inject `RmqPublisherService` from `@libs/common` and use `this.rmqPublisher.request('routing-key', payload)` to forward requests to microservices and return the response Promise. Do NOT use `@nestjs/microservices` ClientProxy.

4. **Microservice Handlers**:
   - Microservices DO NOT use controllers. All RabbitMQ handlers must reside directly in the Service layer (e.g., `<service-name>.service.ts`) using the `@RabbitRPC` decorator from `@golevelup/nestjs-rabbitmq`.
   - Business logic must reside in the Service layer.
   - For database errors or business validations internally, throw standard NestJS exceptions or `AppException` and assume `HttpExceptionFilter` maps them correctly over RabbitMQ.
