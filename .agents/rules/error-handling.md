---
name: error-handling
description: Conventions for error handling, AppException structure, standardized JSON error responses, and HTTP status codes.
---

# Error Handling & Exception Conventions

All microservices and the API Gateway MUST follow these standardized patterns for error handling and reporting.

## 🏗 Exception Architecture

### 1. Standard NestJS Exceptions with Error Codes

Do NOT create custom exception wrapper classes. Use standard NestJS `HttpException` subclasses (`UnprocessableEntityException`, `BadRequestException`, `NotFoundException`, `ServiceUnavailableException`, etc.) and pass the domain error code via options:

- **`code`**: A unique domain-specific error code (e.g., `OrderErrorCode.ORDER_NOT_FOUND`).
- **`details`**: Optional array of validation errors `{ field, message }`.

Example:

```typescript
throw new BadRequestException('Order not found', {
  errorCode: OrderErrorCode.ORDER_NOT_FOUND,
});
```

### 2. Standardized Response Format

The `HttpExceptionFilter` at the API Gateway and `RmqRpcExceptionFilter` in microservices ensure all error responses follow this exact JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ ... ] // Optional, only for validation/multi-error scenarios
  }
}
```

## 🚥 HTTP Status Code Usage

- **`422 Unprocessable Entity`**: MANDATORY for validation errors (e.g., `ValidationPipe`).
- **`400 Bad Request`**: For general business logic violations.
- **`404 Not Found`**: When a resource does not exist.
- **`401/403`**: For authentication and authorization failures.
- **`500 Internal Server Error`**: For unexpected code crashes (mapped to `SystemErrorCode.UNCAUGHT_EXCEPTION`).
- **`503 Service Unavailable`**: When circuit breaker is open or external dependencies fail.

## 🏷 Error Code Conventions

Error codes are enums defined in `libs/contract/src/<domain>/error/<domain>-code.error.ts`.

| Prefix / Enum        | Domain      | Path                                                        |
| :------------------- | :---------- | :---------------------------------------------------------- |
| `SystemErrorCode`    | System/Base | `libs/contract/src/base/error/system-error-codes.ts`        |
| `UserErrorCode`      | User        | `libs/contract/src/user/error/user-code.error.ts`           |
| `OrderErrorCode`     | Order       | `libs/contract/src/order/error/order-code.error.ts`         |
| `ProductErrorCode`   | Product     | `libs/contract/src/product/error/product-code.error.ts`     |
| `InventoryErrorCode` | Inventory   | `libs/contract/src/inventory/error/inventory-code.error.ts` |
| `PaymentErrorCode`   | Payment     | `libs/contract/src/payment/error/payment-code.error.ts`     |
| `ShippingErrorCode`  | Shipping    | `libs/contract/src/shipping/error/shipping-code.error.ts`   |

## 📂 Directory & File Conventions

1. **Folder Name**: `libs/contract/src/<domain>/error/` (and `libs/contract/src/base/error/`).
2. **File Name**: `<domain>-code.error.ts` (e.g. `order-code.error.ts`, `product-code.error.ts`).
3. **Re-export**: Re-export from `libs/contract/src/<domain>/error/index.ts` and barrel `libs/contract/src/index.ts`.

## 🛡 Validation Setup (API Gateway `main.ts`)

In `main.ts`, the `ValidationPipe` is configured with an `exceptionFactory` to throw `UnprocessableEntityException` with `SystemErrorCode.VALIDATION_FAILED`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      throw new UnprocessableEntityException(
        {
          message: 'Validation error',
          details: errors.map((err: ValidationError) => ({
            field: err.property,
            message: Object.values(err.constraints ?? {})[0],
          })),
        },
        {
          errorCode: SystemErrorCode.VALIDATION_FAILED,
        },
      );
    },
  }),
);
```
