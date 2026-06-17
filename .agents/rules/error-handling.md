---
name: error-handling
description: Conventions for error handling, AppException structure, standardized JSON error responses, and HTTP status codes.
---

# Error Handling & Exception Conventions

All microservices and the API Gateway MUST follow these standardized patterns for error handling and reporting.

## 🏗 Exception Architecture

### 1. `AppException` (`libs/common/src/exception/app-exception.ts`)
ALWAYS use `AppException` for business and validation errors. It extends `HttpException` and supports:
- **`code`**: A unique domain-specific error code (e.g., `ORD_001`).
- **`status`**: Optional HTTP status code (defaults to `400 BAD_REQUEST`).
- **`details`**: Optional array of validation errors `{ field, message }`.

### 2. Standardized Response Format
The `HttpExceptionFilter` at the API Gateway ensures all error responses follow this exact JSON structure:
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
- **`500 Internal Server Error`**: For unexpected code crashes (mapped to `SYS_999`).

## 🏷 Error Code Conventions

Error codes must follow the pattern `[DOMAIN]_[NUMBER]` (e.g., `PRD_001`).

| Prefix | Domain | Path |
| :--- | :--- | :--- |
| **`SYS`** | System/Common | `libs/contract/src/common/error/` |
| **`USR`** | User | `libs/contract/src/user/error/` |
| **`ORD`** | Order | `libs/contract/src/order/error/` |
| **`PRD`** | Product | `libs/contract/src/product/error/` |
| **`INV`** | Inventory | `libs/contract/src/inventory/error/` |
| **`PAY`** | Payment | `libs/contract/src/payment/error/` |
| **`SHP`** | Shipping | `libs/contract/src/shipping/error/` |

## 📂 Directory & File Conventions

1. **Folder Name**: ALWAYS use singular `error` or `exception`.
   - `libs/contract/src/<domain>/error/`
   - `libs/common/src/exception/`
2. **File Name**: Use `<domain>-error-code.ts` (singular).
   - Example: `order-error-code.ts`.
3. **Barrel File**: Every `error` folder MUST have an `index.ts` that re-exports the error codes.

## 🛡 Validation Setup

In `main.ts`, the `ValidationPipe` MUST be configured with an `exceptionFactory` to throw `AppException` with status `422`:

```typescript
new ValidationPipe({
  exceptionFactory: (errors) => {
    throw new AppException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: SystemErrorCode.VALIDATION_FAILED,
      message: 'Validation error',
      details: errors.map(err => ({
        field: err.property,
        message: Object.values(err.constraints ?? {})[0],
      })),
    });
  },
})
```
