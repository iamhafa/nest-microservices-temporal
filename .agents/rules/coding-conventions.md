---
name: coding-conventions
description: General TypeScript and programming conventions for the entire project
---

# General Coding Conventions

These rules apply to all TypeScript and JavaScript files across the entire monorepo (`apps/` and `libs/`).

## 📏 Naming Conventions

Consistency in naming is crucial for maintainability:

1.  **Variables, Properties, and Functions**: Use `camelCase`.
    *   Correct: `const userId: string = '...';`, `function calculateTotal() { ... }`
2.  **Classes, Interfaces, Enums, and Types**: Use `PascalCase`.
    *   Correct: `class OrderService { ... }`, `interface UserProfile { ... }`
3.  **Constants (Global/Module level)**: Use `UPPER_SNAKE_CASE`.
    *   Correct: `const MAX_RETRY_ATTEMPTS: number = 3;`
4.  **Files**: Use `kebab-case`.
    *   Correct: `order-service.module.ts`, `jwt-auth.guard.ts`

## 🛡 Type Safety (CRITICAL)

To leverage the full power of TypeScript and prevent runtime errors:

1.  **Explicit Typing**: Always declare types for variables, method parameters, and function return values.
    *   ✅ **Recommended**: `const name: string = 'Antigravity';`
    *   ❌ **Avoid**: `const name = 'Antigravity';` (unless the type is extremely complex or inferred by a library-specific generic).
2.  **Avoid `any`**: Never use `any` unless absolutely necessary (e.g., when dealing with external legacy libraries). Use `unknown` or a specific interface instead.

## 🔄 Async / Await Handling

1.  **Always use `async/await`**: Prefer `async/await` over raw Promises (`.then()`, `.catch()`).
2.  **Error Handling**: Use `try/catch` blocks for all high-risk operations (API calls, DB queries, Temporal activities) to ensure graceful failure.
3.  **Return Types**: Always specify `Promise<T>` as the return type for async functions.

## 💎 Clean Code Principles

1.  **Magic Numbers/Strings**: Never use raw numbers or strings in business logic. Define them as constants or enums.
    *   Correct: `if (status === OrderStatus.PENDING) ...`
    *   Incorrect: `if (status === 'pending') ...`
2.  **Dry (Don't Repeat Yourself)**: If a logic is used in more than one service, move it to a shared library in `libs/`.
