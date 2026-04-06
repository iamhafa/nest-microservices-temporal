# API & Contract Conventions

When writing or modifying code in this workspace, ALWAYS adhere to the following rules for API Gateways and Data Contracts (DTOs):

1. **DTOs (`libs/contract`)**:
   - Always use `@ApiProperty()` on fields for Swagger documentation.
   - Always use `class-validator` decorators (e.g., `@IsString()`, `@IsNotEmpty()`) for strict validation.
   - Always use `@Expose({ name: 'snake_case' })` from `class-transformer` to ensure request/response payloads are serialized into `snake_case`.

2. **API Documentation (Swagger/OpenAPI) [REQUIRED]**:
   - Every controller method MUST have `@ApiOperation({ summary: 'Short description' })`.
   - Use specific response decorators:
     - `@ApiOkResponse()` or `@ApiCreatedResponse()` for success.
     - `@ApiBadRequestResponse({ description: 'Validation failed' })` for endpoints using DTO validation.
     - `@ApiInternalServerErrorResponse({ description: 'Internal server error' })` for unexpected failures.
   - **Ambiguous Return Types**: If the return type is dynamic or unknown, do NOT specify `type`. Instead, provide a clear `description` within `@ApiOkResponse()` explaining the response structure.

3. **API Gateway Endpoints (`apps/api-gateway`)**:
   - For update or action endpoints (e.g., `PATCH`, `POST`), **place the resource `id` inside the `@Body` DTO** rather than using `@Param('id')` in the URL whenever possible. This allows you to forward a single payload via RabbitMQ without manual merging.
   - Use `this.clientProxy.send('message-pattern', payload)` to forward requests to microservices and return the `Observable` directly.

4. **Microservice Handlers**:
   - Internal microservice controllers must use `@MessagePattern('message-pattern')` from `@nestjs/microservices`.
   - Business logic must reside in the Service layer, not the Controller.
   - For database errors or business validations internally, throw standard HTTP exceptions (e.g., `UnauthorizedException`, `ConflictException`) and assume `RpcExceptionFilter` maps them correctly over RabbitMQ.
