---
name: auth-conventions
description: Authentication and authorization rules, including JwtAuthGuard, RolesGuard, Public and Roles decorators, and CLS userId context.
---

# Authentication & Authorization Conventions

When writing or modifying API Gateway endpoints and controllers, ALWAYS adhere to the following security rules:

## 🔐 Authentication Guard (JWT)

- By default, ALL endpoints in the API Gateway (`apps/api-gateway`) are **private** and require a valid Bearer JWT token in the `Authorization` header.
- This is enforced globally in `ApiGatewayModule` using the `JwtAuthGuard` from `@libs/auth`.

### 🔓 Public Endpoints
- To make an endpoint public (bypass JWT validation), decorate the controller method or class with `@Public()` from `@libs/auth`:

```typescript
import { Public } from '@libs/auth';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

---

## 🎖 Authorization Guard (RBAC)

- For endpoints restricted to specific roles, decorate the method or class with `@Roles(UserRole.ADMIN, ...)` from `@libs/auth`.
- If you use `@Roles()`, you must ensure `RolesGuard` is configured or active. Note that `RolesGuard` is currently imported and used on a need-basis or defined globally where relevant.
- Roles are defined in the `UserRole` enum (`@libs/contract/user/enum/user-role.enum`).

```typescript
import { Roles } from '@libs/auth';
import { UserRole } from '@libs/contract/user/enum/user-role.enum';
import { Controller, Delete, Param } from '@nestjs/common';

@Controller('users')
export class UserController {
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
```

---

## 👤 Extracting User Identity

### 1. In API Gateway Controllers (HTTP context)
The `JwtAuthGuard` decodes the JWT and attaches the payload to the express `request` object.
You can cast the request object to `IAuthRequest` and access the user payload via `request.user`.

```typescript
import { IAuthRequest } from '@libs/auth';
import { Controller, Get, Req } from '@nestjs/common';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@Req() req: IAuthRequest) {
    const userPayload = req.user; // Contains user_id, email, role, etc.
    return userPayload;
  }
}
```

### 2. Anywhere in the Downstream Execution Flow (CLS Context)
During the authentication step, `JwtAuthGuard` automatically saves the authenticated `user_id` into the CLS context:
```typescript
this.clsService.set('userId', payload.user_id);
```

- **Rule:** You can retrieve the authenticated user's ID anywhere in downstream services (e.g. RabbitMQ publishers, validators) without passing it through DTOs by injecting `ClsService` and calling:
```typescript
const userId = this.clsService.get<number>('userId');
```
