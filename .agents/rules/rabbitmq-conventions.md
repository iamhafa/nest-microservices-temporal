---
name: rabbitmq-conventions
description: Conventions for RabbitMQ communication, SharedRabbitMQModule, RmqPublisherService, RPC patterns, and x-correlation-id propagation.
---

# RabbitMQ Communication Conventions

## 🏗 Architecture Overview

- **Producer (API Gateway)**: Bắn message qua các microservices bằng cách gọi RPC (sử dụng thư viện `@golevelup/nestjs-rabbitmq`).
- **Consumer (Microservices)**: Lắng nghe và xử lý message (dùng `@RabbitRPC`). Không được có file `*.controller.ts`.
- Không sử dụng `@nestjs/microservices` vì khó cấu hình Header động và hạn chế về mặt Interceptor.

## 🔗 SharedRabbitMQModule & RmqPublisherService

Tất cả các kết nối đến RabbitMQ (cho cả Consumer và Producer) **BẮT BUỘC** phải được import thông qua `SharedRabbitMQModule` từ `@libs/common/rabbitmq`.

- **Đối với API Gateway**: 
  - Khai báo `imports: [SharedRabbitMQModule]` trong Feature Module (VD: `UserModule`).
  - Trong Controller, tiêm (inject) `RmqPublisherService` thay vì `AmqpConnection` để gửi message đi.
  - Việc dùng `RmqPublisherService` đảm bảo mọi gói tin gửi đi đều tự động được nhúng `X-Correlation-Id` vào trong Headers phục vụ cho Distributed Tracing.
  
  ```typescript
  export class UserController {
    constructor(private readonly rmqPublisher: RmqPublisherService) {}

    @Post('register')
    registerUser(@Body() dto: CreateUserDto): Promise<any> {
      return this.rmqPublisher.request('user.register', dto);
    }
  }
  ```

- **Đối với Microservices**:
  - Khai báo `imports: [SharedRabbitMQModule]` trong root Module (VD: `UserServiceModule`).
  - Message handler được định nghĩa trực tiếp trong file `*.service.ts` bằng decorator `@RabbitRPC`.
  
  ```typescript
  @Injectable()
  export class UserService {
    @RabbitRPC({
      exchange: RmqExchange.ECOMMERCE,
      routingKey: 'user.register',
      queue: 'user-register-queue',
    })
    async registerUser(dto: CreateUserDto) {
      // Logic
    }
  }
  ```

## ⚠️ Cạm bẫy về Correlation ID (Distributed Tracing vs RPC)

Hệ thống của chúng ta sử dụng `nestjs-cls` để tạo ra một **Trace ID** (`X-Correlation-Id`) xuyên suốt vòng đời của 1 HTTP Request.

**LUẬT BẤT THÀNH VĂN:** 
- **Tuyệt đối KHÔNG** gán đè `clsService.getId()` vào thuộc tính `correlationId` mặc định của AMQP (`amqpConnection.request({ correlationId: ... })`).
- `correlationId` của AMQP được thư viện dùng riêng biệt cho cơ chế gửi/nhận RPC (nó phải Unique cho mỗi lệnh gọi RPC).
- `X-Correlation-Id` của chúng ta phải được truyền thông qua `headers: { 'X-Correlation-Id': ... }`. Ở phía Microservice, `RmqCorrelationIdInterceptor` sẽ tự động hứng Header này và lưu lại vào CLS để ghi log.

## 🚫 Lệnh cấm
1. CẤM tạo file `*.controller.ts` ở các Microservices.
2. CẤM import hoặc sử dụng `ClientsModule` hay `ClientProxy` từ `@nestjs/microservices`.
3. CẤM gán tĩnh (hardcode) giá trị linh động (như `ClsService.getId()`) bên trong `useFactory` của `RabbitMQModule.forRootAsync` vì factory này chỉ chạy 1 lần lúc bootstrap app.

## 🛑 Rationalizations (Anti-patterns)

- **"I'll use `ClientProxy` from `@nestjs/microservices` because it's the standard NestJS way."**
  - **Rebuttal**: NO. We strictly use `@golevelup/nestjs-rabbitmq` and `RmqPublisherService`. Using `ClientProxy` breaks our distributed tracing and dynamic header setup.
- **"I will pass the Correlation ID via the payload body instead of headers."**
  - **Rebuttal**: NO. `X-Correlation-Id` must be passed via AMQP Headers. `nestjs-cls` and our custom interceptors automatically handle it if you use `RmqPublisherService`.

## 🚩 Red Flags

- Seeing `import { ClientProxy }` or `import { ClientsModule }` anywhere.
- Hardcoding or manually generating IDs for `correlationId` in `amqpConnection.request(...)`.
- Services directly returning HTTP status codes (e.g., `HttpStatus.OK`) from `@RabbitRPC` handlers instead of returning raw data or custom RPC response objects.

## ✅ Verification Gates

Before completing a RabbitMQ integration, verify:
- [ ] Is `SharedRabbitMQModule` imported instead of defining a new RabbitMQ connection?
- [ ] Is `RmqPublisherService` injected for sending messages (in API Gateway)?
- [ ] Is `@RabbitRPC` used for receiving messages (in Microservices)?
