---
name: rabbitmq-conventions
description: Conventions for RabbitMQ communication, SharedRabbitMQModule, RmqPublisherService, RPC patterns, x-correlation-id propagation, and message naming conventions.
---

# RabbitMQ Communication Conventions

## 🏗 Architecture Overview

- **Producer (API Gateway)**: Bắn message qua các microservices bằng cách gọi RPC (sử dụng thư viện `@golevelup/nestjs-rabbitmq`).
- **Consumer (Microservices)**: Lắng nghe và xử lý message (dùng `@RabbitRPC`). Không được có file `*.controller.ts`.
- Không sử dụng `@nestjs/microservices` vì khó cấu hình Header động và hạn chế về mặt Interceptor.

## 🏷 Message Naming Convention (Quy tắc đặt tên Routing Key)

Routing Key được định nghĩa dưới dạng **enum** trong `libs/messaging/src/enum/routing-key/<domain>-routing-key.enum.ts` (mỗi domain 1 file), KHÔNG dùng string literal rải rác trong code.

**Format thực tế:** `<domain>.<action>`

Trong đó:

1. **`<domain>`**: Tên domain/feature, viết thường (ví dụ: `order`, `product`, `user`, `inventory`, `shipping`, `payment`).
2. **`<action>`**: Hành động, viết **kebab-case** khi có nhiều từ.

Ví dụ theo đúng code hiện tại (`OrderRoutingKey`, `UserRoutingKey`):

```typescript
export enum OrderRoutingKey {
  CREATE = 'order.create',
  CANCEL = 'order.cancel',
  GET_BY_ID = 'order.get-by-id',
  GET_MY_ORDERS = 'order.get-my-orders',
  UPDATE_STATUS = 'order.update-status',
}

export enum UserRoutingKey {
  REGISTER = 'user.register',
  LOGIN = 'user.login',
  GET_BY_ID = 'user.get-by-id',
}
```

> ⚠️ **Lưu ý:** Hệ thống hiện tại **chỉ dùng RPC request/response** (`RmqPublisherService.request()`). Chưa có cơ chế event publish/subscribe (`RmqPublisherService.publish` / routing key hậu tố `.event` CHƯA được implement). Một số enum có giá trị dạng quá khứ (vd `OrderRoutingKey.CREATED = 'order.created'`) được dùng như RPC handler, không phải event bus. Nếu sau này thêm event-driven, cập nhật rule này kèm code.

## 🔗 SharedRabbitMQModule & RmqPublisherService

Tất cả các kết nối đến RabbitMQ (cho cả Consumer và Producer) **BẮT BUỘC** phải được import thông qua `SharedRabbitMQModule` từ `@libs/messaging`.

- **Module Configuration**:
  - `SharedRabbitMQModule` được gắn decorator `@Global()` trong `@libs/messaging`.
  - Được import 1 lần tại root module của **API Gateway** (`ApiGatewayModule`) và root module của từng **Microservice** (VD: `UserServiceModule`, `OrderServiceModule`).
- **Đối với API Gateway**:
  - Trong Controller hoặc Service của Gateway, tiêm (inject) `RmqPublisherService` thay vì `AmqpConnection` để gửi message đi.
  - Việc dùng `RmqPublisherService` đảm bảo mọi gói tin gửi đi đều tự động được nhúng `X-Correlation-Id` và `X-User-Id` (lấy từ CLS context) vào trong Headers phục vụ Distributed Tracing & User propagation.

  ```typescript
  import { RmqPublisherService, UserRoutingKey } from '@libs/messaging';

  export class UserController {
    constructor(private readonly rmqPublisher: RmqPublisherService) {}

    @Post('register')
    registerUser(@Body() dto: RegisterUserDto): Promise<AuthResponseDto> {
      return this.rmqPublisher.request(UserRoutingKey.REGISTER, dto); // <- dùng enum, KHÔNG string literal
    }
  }
  ```

- **Đối với Microservices**:
  - Khai báo `imports: [SharedRabbitMQModule, SharedClsModule.forRoot()]` trong root Module (VD: `UserServiceModule`).
  - Đăng ký filter và interceptor trong `main.ts` của microservice:
    ```typescript
    app.useGlobalFilters(new RmqRpcExceptionFilter());
    app.useGlobalInterceptors(new RmqRpcResponseInterceptor());
    ```
  - Message handler được định nghĩa trực tiếp trong file `*.service.ts` bằng decorator `@RabbitRPC`.

  ```typescript
  import { RabbitRPC, RabbitPayload } from '@golevelup/nestjs-rabbitmq';
  import { RmqExchange, RmqQueue, UserRoutingKey } from '@libs/messaging';

  @Injectable()
  export class UserService {
    @RabbitRPC({
      exchange: RmqExchange.ECOMMERCE,
      routingKey: UserRoutingKey.REGISTER, // <- dùng enum
      queue: RmqQueue.USER_QUEUE, // <- dùng enum RmqQueue, KHÔNG hardcode string
    })
    async registerUser(@RabbitPayload() dto: RegisterUserDto) {
      // Logic
    }
  }
  ```

## ⚠️ Correlation ID & User Context Flow

Hệ thống sử dụng `nestjs-cls` để duy trì `X-Correlation-Id` và `X-User-Id` xuyên suốt vòng đời của 1 request:

1. **Tại API Gateway**: `ClsModule.forRoot()` (HTTP middleware) tự sinh `X-Correlation-Id` (UUID) và lưu `userId` khi JWT được verify qua `JwtAuthGuard`.
2. **Khi gửi qua RabbitMQ**: `RmqPublisherService.request()` tự động lấy `correlationId` và `userId` từ CLS, đặt vào message headers (`headers: { 'X-Correlation-Id': ..., 'X-User-Id': ... }`).
3. **Tại Microservice**: `SharedClsModule.forRoot()` (từ `@libs/common`) tự động lắng nghe RabbitMQ context (`isRabbitContext`), trích xuất headers trên và inject vào CLS context của microservice để ghi log qua `SharedLoggerModule`.
4. **RPC Responses**:
   - Thành công: `RmqRpcResponseInterceptor` tự bọc data thành `{ success: true, data }`.
   - Lỗi: `RmqRpcExceptionFilter` bắt `HttpException` và trả về `{ success: false, error: { code, message, status, details } }`.
   - Phía Gateway: `RmqPublisherService` tự giải nén, nếu `!response.success` sẽ ném lại `HttpException` chuẩn để `HttpExceptionFilter` của Gateway trả về cho client.

**LUẬT BẤT THÀNH VĂN:**

- **Tuyệt đối KHÔNG** gán đè `clsService.getId()` vào thuộc tính `correlationId` mặc định của AMQP (`amqpConnection.request({ correlationId: ... })`).
- `correlationId` của AMQP được thư viện dùng riêng biệt cho cơ chế gửi/nhận RPC nội bộ.
- `X-Correlation-Id` của chúng ta phải được truyền thông qua `headers: { 'X-Correlation-Id': ... }`.

## 🚫 Lệnh cấm

1. CẤM tạo file `*.controller.ts` ở các Microservices.
2. CẤM import hoặc sử dụng `ClientsModule` hay `ClientProxy` từ `@nestjs/microservices`.
3. CẤM gán tĩnh (hardcode) giá trị linh động (như `ClsService.getId()`) bên trong `useFactory` của `RabbitMQModule.forRootAsync` vì factory này chỉ chạy 1 lần lúc bootstrap app.

## 🛑 Rationalizations (Anti-patterns)

- **"I'll use `ClientProxy` from `@nestjs/microservices` because it's the standard NestJS way."**
  - **Rebuttal**: NO. We strictly use `@golevelup/nestjs-rabbitmq` and `RmqPublisherService`. Using `ClientProxy` breaks our distributed tracing and dynamic header setup.
- **"I will pass the Correlation ID via the payload body instead of headers."**
  - **Rebuttal**: NO. `X-Correlation-Id` must be passed via AMQP Headers. `RmqPublisherService` and `SharedClsModule` automatically handle it.

## 🚩 Red Flags

- Seeing `import { ClientProxy }` or `import { ClientsModule }` anywhere.
- Hardcoding or manually generating IDs for `correlationId` in `amqpConnection.request(...)`.
- Services directly returning HTTP status codes (e.g., `HttpStatus.OK`) from `@RabbitRPC` handlers instead of returning raw data or custom RPC response objects.
- Routing keys not following the `<domain>.<action>` pattern or not using enums.

## ✅ Verification Gates

Before completing a RabbitMQ integration, verify:

- [ ] Is `SharedRabbitMQModule` imported from `@libs/messaging`?
- [ ] Is `SharedClsModule.forRoot()` imported in the microservice's root module?
- [ ] Is `RmqPublisherService` injected for sending messages (in API Gateway)?
- [ ] Is `@RabbitRPC` used for receiving messages (in Microservices)?
- [ ] Does the routing key use the dedicated domain routing key enum from `@libs/messaging`?
