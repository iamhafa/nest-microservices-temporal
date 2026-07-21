---
name: temporal-saga-builder
description: Use this skill when asked to create or modify a Temporal Workflow, Saga orchestration, or Activity interface in this repository.
---

# 🌀 Temporal Saga Builder Skill

This skill provides step-by-step guidance and code templates for scaffolding and implementing **Temporal Workflows**, **Saga Orchestrations**, and **Activity Interfaces** in this microservices monorepo.

---

## 🏗 Architecture Quick Reference

| Artifact | Location | Convention |
| :--- | :--- | :--- |
| **Workflows** | `apps/orchestrator-worker/src/workflows/<domain>/` | Exported as `async function <domain>Workflow(...)` |
| **Activity Interfaces** | `libs/temporal/src/activity/interface/` | Interface `I<Service>Activity` |
| **Task Queue Enums** | `libs/temporal/src/queue/enum/workflow-task.queue.ts` | Enum value `<SERVICE> = '<service>-workflow-task-queue'` |
| **Activity Implementation** | `apps/<service>-service/src/activity/` | NestJS `@Activity()` class implementing interface |

---

## 📋 Step-by-Step Scaffolding Process

### Step 1: Define Activity Interface (`libs/temporal`)

Define contract and compensation methods for the microservice in `libs/temporal/src/activity/interface/<service>-activity.interface.ts`:

```typescript
export interface IPaymentActivity {
  chargePayment(input: ChargePaymentDto): Promise<ChargePaymentResult>;
  refundPayment(input: RefundPaymentDto): Promise<void>; // Compensation method
}
```
*Don't forget to export it in `libs/temporal/src/activity/index.ts`.*

---

### Step 2: Register Task Queue Enum (`libs/temporal`)

Ensure your target service has a task queue entry in `libs/temporal/src/queue/enum/workflow-task.queue.ts`:

```typescript
export enum WorkFlowTaskQueue {
  ORDER = 'order-workflow-task-queue',
  PAYMENT = 'payment-workflow-task-queue',
  INVENTORY = 'inventory-workflow-task-queue',
  SHIPPING = 'shipping-workflow-task-queue',
}
```

---

### Step 3: Write the Workflow Function (`apps/orchestrator-worker`)

Create `apps/orchestrator-worker/src/workflows/<domain>/<name>.workflow.ts`:

```typescript
import { proxyActivities, ActivityInterfaceFor } from '@temporalio/workflow';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import type { IPaymentActivity } from '@libs/temporal/activity/interface/payment-activity.interface';
import type { IInventoryActivity } from '@libs/temporal/activity/interface/inventory-activity.interface';

// 1. Setup Proxy Activities per service queue
const paymentActivities: ActivityInterfaceFor<IPaymentActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PAYMENT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const inventoryActivities: ActivityInterfaceFor<IInventoryActivity> = proxyActivities({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

// 2. Define Workflow Function with Saga Compensation Pattern
export async function placeOrderWorkflow(input: PlaceOrderWorkflowInput): Promise<PlaceOrderWorkflowResult> {
  let inventoryReserved = false;
  let paymentCharged = false;

  try {
    // Step 1: Reserve Inventory
    await inventoryActivities.reserveInventory({ orderId: input.orderId, items: input.items });
    inventoryReserved = true;

    // Step 2: Charge Payment
    await paymentActivities.chargePayment({ orderId: input.orderId, amount: input.totalAmount });
    paymentCharged = true;

    // Step 3: Confirm Order / Inventory
    await inventoryActivities.confirmInventory({ orderId: input.orderId });

    return { success: true, orderId: input.orderId };
  } catch (error) {
    // 3. Compensation Steps (REVERSE ORDER of completed actions)
    if (paymentCharged) {
      await paymentActivities.refundPayment({ orderId: input.orderId });
    }
    if (inventoryReserved) {
      await inventoryActivities.releaseInventory({ orderId: input.orderId });
    }

    throw error;
  }
}
```

*Re-export the workflow in `apps/orchestrator-worker/src/workflows/<domain>/index.ts`.*

---

### Step 4: Implement Activity in Microservice (`apps/<service>-service`)

Create `apps/<service>-service/src/activity/<action>.activity.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Activity } from 'nestjs-temporal-core';
import { IPaymentActivity } from '@libs/temporal/activity/interface/payment-activity.interface';

@Injectable()
@Activity()
export class PaymentActivity implements IPaymentActivity {
  constructor(private readonly paymentService: PaymentService) {}

  async chargePayment(input: ChargePaymentDto): Promise<ChargePaymentResult> {
    // IDEMPOTENCY CHECK: Verify DB before performing charge
    const existing = await this.paymentService.findByOrderId(input.orderId);
    if (existing && existing.status === PaymentStatus.COMPLETED) {
      return { paymentId: existing.id, status: existing.status };
    }

    return this.paymentService.processCharge(input);
  }

  async refundPayment(input: RefundPaymentDto): Promise<void> {
    const existing = await this.paymentService.findByOrderId(input.orderId);
    if (!existing || existing.status === PaymentStatus.REFUNDED) {
      return; // Already refunded or nothing to refund
    }

    await this.paymentService.processRefund(input);
  }
}
```

---

## ⚠️ Critical Rules & Anti-Patterns

1. **Strict Determinism**: NO `Math.random()`, `Date.now()`, `axios`, or TypeORM Repository calls inside a Workflow file. ALL side effects must happen inside Activities.
2. **Reverse Rollback Order**: Compensations MUST execute in reverse order of forward steps.
3. **Idempotency Mandatory**: All state-mutating activities must check the database first or use deterministic idempotency keys before executing API calls.
4. **Isolated Task Queues**: Never mix activities of different services on the same task queue. Each proxy MUST specify its own `WorkFlowTaskQueue.<SERVICE>`.

---

## ✅ Quality Checklist

- [ ] Activity interface declared in `libs/temporal/src/activity/interface/` and exported.
- [ ] Task Queue registered in `WorkFlowTaskQueue` enum.
- [ ] Workflow handles Saga compensation in a `try/catch` block (reverse order).
- [ ] Activities implemented with idempotency checks.
- [ ] Workflow exported in domain `index.ts` barrel file.
