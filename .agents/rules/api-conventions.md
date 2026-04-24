# API & Contract Conventions

When writing or modifying code in this workspace, ALWAYS adhere to the following rules for API Gateways and Data Contracts (DTOs):

1. **DTOs (`libs/contract`)**:
   - Always use `@ApiProperty()` on fields for Swagger documentation.
   - Always use `class-validator` decorators (e.g., `@IsString()`, `@IsNotEmpty()`) for strict validation.
   - Always use `@Expose({ name: 'snake_case' })` from `class-transformer` to ensure request/response payloads are serialized into `snake_case`.

2. **API Documentation (Swagger/OpenAPI) [MANDATORY]**:
   - Every controller method in `api-gateway` MUST have `@ApiOperation({ summary: 'Short description' })`.
   - Use specific response decorators for ALL endpoints:
     - `@ApiOkResponse()` or `@ApiCreatedResponse()` for success.
     - `@ApiAcceptedResponse()` for async operations (like starting a workflow).
     - `@ApiBadRequestResponse({ description: 'Validation failed' })` for endpoints using DTO validation.
     - `@ApiNotFoundResponse({ description: 'Resource not found' })` where applicable.
     - `@ApiInternalServerErrorResponse({ description: 'Internal server error' })` for unexpected failures.

3. **API Gateway Endpoints (`apps/api-gateway`)**:
   - For update or action endpoints (e.g., `PATCH`, `POST`), **place the resource `id` inside the `@Body` DTO** rather than using `@Param('id')` in the URL whenever possible. This allows you to forward a single payload via RabbitMQ without manual merging.
   - Use `this.clientProxy.send('message-pattern', payload)` to forward requests to microservices and return the `Observable` directly.

4. **Microservice Handlers**:
   - Internal microservice controllers must use `@MessagePattern('message-pattern')` from `@nestjs/microservices`.
   - Business logic must reside in the Service layer, not the Controller.
   - For database errors or business validations internally, throw standard HTTP exceptions (e.g., `UnauthorizedException`, `ConflictException`) and assume `RpcExceptionFilter` maps them correctly over RabbitMQ.
