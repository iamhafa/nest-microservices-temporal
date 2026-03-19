---
name: temporal-workflow
description: Rules and patterns for writing Temporal workflows, activities, and Saga compensation in this NestJS monorepo
---

# Temporal Workflow & Activity Patterns

## 🏗 Architecture Overview

- **Orchestrator Worker** (`apps/orchestrator-worker`): Hosts and runs Temporal workflows.
- **Activity Interfaces** (`libs/temporal/src/activity/interface/`): Define contracts for each service's activities.
- **Task Queues** (`libs/temporal/src/queue/enum/workflow-task.queue.ts`): Each microservice has its own dedicated task queue.
- **Shared Module** (`libs/temporal/src/temporal.module.ts`): `SharedTemporalModule.forRoot()` wraps `nestjs-temporal-core` with config-driven connection.

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

## 🆕 Adding a New Workflow Checklist

When creating a new workflow:

1. Define activity interface(s) in `libs/temporal/src/activity/interface/`.
2. Re-export from `libs/temporal/src/activity/index.ts`.
3. Add task queue entry in `WorkFlowTaskQueue` enum if new service.
4. Create workflow file in `apps/orchestrator-worker/src/workflows/<domain>/`.
5. Export from domain `index.ts` barrel file.
6. Implement Saga compensation in try/catch if the workflow involves multiple services.
