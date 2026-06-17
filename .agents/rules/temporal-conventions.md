---
name: temporal-conventions
description: Conventions and rules for Temporal workflows, activities, Saga pattern, task queues, and idempotency.
---

# Temporal Workflow & Activity Patterns

## 🏗 Architecture Overview

- **Orchestrator Worker** (`apps/orchestrator-worker`): Hosts and runs Temporal workflows.
- **Activity Interfaces** (`libs/temporal/src/activity/interface/`): Define contracts for each service's activities.
- **Task Queues** (`libs/temporal/src/queue/enum/workflow-task.queue.ts`): Each microservice has its own dedicated task queue.
- **Shared Module** (`libs/temporal/src/shared-temporal.module.ts`): `SharedTemporalModule.forRoot()` wraps `nestjs-temporal-core` with config-driven connection.

## 📂 File Organization Rules

1. **Workflows** are placed in: `apps/orchestrator-worker/src/workflows/<domain>/`
   - Each domain folder MUST have an `index.ts` barrel file that re-exports all workflows.
   - Workflow functions are defined in descriptive files like `process-order.workflow.ts`.

2. **Activity Interfaces** are defined in: `libs/temporal/src/activity/interface/`
   - Naming: `I<Service>Activity` (e.g., `IOrderActivity`, `IPaymentActivity`).
   - File naming: `<service>-activity.interface.ts`.
   - All interfaces are re-exported from `libs/temporal/src/activity/index.ts`.

3. **Task Queues** are defined in enum `WorkFlowTaskQueue`:
   - Format: `<SERVICE> = '<service>-workflow-task-queue'`.
   - One queue per service. Every new service MUST register a new enum value.

## ⚙️ Workflow Implementation Rules (CRITICAL)

### Mandatory Workflow Rule

- **ALL cross-service operations** (e.g., Product + Inventory, Order + Payment) MUST use a Temporal workflow for orchestration.
- **Initial Persistence**: Moving the initial record creation (e.g., `Order`, `Product`) into a workflow activity is MANDATORY to ensure atomicity across services.
- **Service Response**: Services initiating a workflow should return the `workflowId` or a "Pending" response, rather than waiting for completion or assuming synchronous success.

### Proxy Activities Setup

Each service's activities are proxied separately with its **own task queue**:

```typescript
const paymentActivities: ActivityInterfaceFor<IPaymentActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});
```

**Rules:**

- Always use `ActivityInterfaceFor<T>` for type-safe proxy.
- Each proxy MUST specify its dedicated `taskQueue` from `WorkFlowTaskQueue`.
- Default retry: `maximumAttempts: 3`, `backoffCoefficient: 2`, `initialInterval: '1 second'`.
- Default timeout: `startToCloseTimeout: '30 seconds'`.

### Workflow Function Signature

- Workflows are **plain async functions** (NOT classes).
- Export with descriptive names: `export async function placeOrderWorkflow(...)`.
- Workflow must accept a DTO input and a resource ID (e.g., `orderId`).

## 🔄 Saga Pattern & Compensation (CRITICAL)

This project uses the **Saga Pattern** with manual compensation in a try/catch block:

```
try {
  // Forward steps (in order)
  Step 1: Validate → Step 2: Reserve → Step 3: Pay → Step 4: Confirm → Step 5: Ship
} catch {
  // Compensation steps (reverse order of completed steps)
  Compensate payment → Compensate inventory → Update status to FAILED
}
```

**Rules:**

1. Track compensatable resources (e.g., `paymentId`) as variables declared before `try`.
2. In `catch`, check what was completed before compensating (e.g., `if (paymentId)` before refund).
3. Always update the order status to `FAILED` as the last compensation step.
4. Compensation order is **reverse** of the forward execution order.

## 🛡 Activity Interface Design Rules

- Activity methods must return `Promise<T>`.
- Each interface groups actions for **one service** only.
- Compensation methods must be paired with their forward methods:
  - `reserveInventory` ↔ `releaseInventory`
  - `chargePayment` ↔ `refundPayment`
  - `confirmInventory` ↔ `restoreInventory`
- Method parameters should be minimal: use IDs and DTOs, not full objects.

## 🔒 Activity Idempotency (CRITICAL)

Because Temporal automatically retries Activities upon failures or network timeouts, **every state-mutating Activity MUST be idempotent**.

**Rules:**

1. **Check Database First**: Before performing any external API call (e.g., charging a payment), query the database to verify if the operation was already completed successfully in a previous attempt.
2. **Deterministic Keys**: For external APIs that support idempotency (like Stripe), ALWAYS pass a deterministically generated `idempotencyKey` (e.g., `charge_order_${orderId}`). Do NOT store this key in the database if it is purely deterministic and you are acting as the API client.
3. **Graceful Skips**: If an Activity detects that its work is already done (e.g., payment is already refunded), it should log a message and return success immediately instead of throwing an error.

## 🛑 Rationalizations (Anti-patterns)

- **"I'll inject a TypeORM repository or database connection directly into the workflow for a quick query."**
  - **Rebuttal**: NO. Workflows must be strictly pure, deterministic functions. ALL side effects, including database queries, must be handled in an Activity.
- **"I don't need idempotency checks since this activity is simple."**
  - **Rebuttal**: NO. Temporal will retry failed activities automatically. Every state-mutating activity MUST verify if the action was already completed.

## 🚩 Red Flags

- Seeing `import { Repository }` or `@InjectRepository` inside a workflow file.
- `Math.random()`, `Date.now()`, or direct UUID generation inside a workflow. (Use Temporal's deterministic utilities if absolutely necessary, or pass them in from the caller/activity).
- State-mutating activities without a `SELECT` query or API idempotency key check at the beginning.

## ✅ Verification Gates

Before completing a Temporal integration, verify:
- [ ] Is the compensation logic (try/catch) implemented in the exact REVERSE order of execution?
- [ ] Are all cross-service operations orchestrated by a workflow?
- [ ] Are activities marked as idempotent and handling retry scenarios gracefully?
- [ ] Are workflows purely deterministic (no DB, no HTTP calls directly)?
