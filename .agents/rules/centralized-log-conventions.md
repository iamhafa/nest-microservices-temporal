---
trigger: model_decision
description: Rules and architectural flow for Correlation ID, Logging, and Context Propagation across Microservices, API Gateway, RabbitMQ, and Temporal.
---

# Distributed Tracing & Observability

## 🔍 Architecture Overview

This NestJS Microservices project uses a **Distributed Tracing** architecture based on a persistent `correlationId`. This ID ensures that a single request can be tracked across the API Gateway, RabbitMQ message brokers, individual Microservices, and Temporal workflows.

## 📦 Core Components

1. **`nestjs-cls` (Continuation-Local Storage):** Used to hold the `correlationId` in memory (RAM) and scope it to the lifecycle of a single request or message execution context.
2. **RabbitMQ Headers (`X-Correlation-Id`):** Used to transport the `correlationId` over the network between services.
3. **Pino Logger (`nestjs-pino`):** Automatically injects the `correlationId` into every JSON log output.
4. **Temporal Workflows:** Uses the `correlationId` as part of the `workflowId` to enable easy searching on the Temporal Web UI.

## 🔄 The Correlation ID Flow

### 1. API Gateway (Entry Point)

- The API Gateway configures `ClsModule.forRoot()` with `middleware.mount: true`, an `idGenerator` (`randomUUID()`), and a `setup` hook.
- The `setup` hook stores the generated id in CLS (`clsService.set('correlationId', id)`) and returns it to the client via the `X-Correlation-Id` response header.
- **Rule:** The Gateway MUST pass this ID in the message headers when publishing to RabbitMQ (handled automatically by `RmqPublisherService`).

### 2. RabbitMQ (Transport Layer)

- The Correlation ID cannot travel through the network via CLS. It is transported inside the RabbitMQ message properties under `headers: { 'X-Correlation-Id': '...' }` (alongside `X-User-Id`), attached automatically by `RmqPublisherService.request()`.

### 3. Microservice (Consumer)

- When a Microservice (e.g., `order-service`, `product-service`) consumes a message, the `RmqContextInterceptor` (`libs/messaging/src/interceptor/rmq-context.interceptor.ts`) is triggered.
- It extracts `X-Correlation-Id` (and `X-User-Id`) from the RabbitMQ message properties.
- It wraps the execution context using `clsService.run()` and injects the values: `clsService.set('correlationId', correlationId)` and `clsService.set('userId', userId)`.
- **Rule:** ALL async handlers and services called downstream within this message context will now share the same `correlationId`.

### 4. Logging & Operations

- **Centralized Logging:** The `SharedLoggerModule` uses a `pinoHttp` customProps factory to read `cls.get('correlationId')`. Every `logger.info()` or `logger.error()` will automatically include this ID.
- **Temporal Workflow Initialization:** When a service starts a workflow, it MUST extract the `correlationId` and append it to the `workflowId` to maintain traceability.

  ```typescript
  // Example rule for starting Temporal Workflows
  const correlationId = this.clsService.get('correlationId');
  const workflowId = `place-order:${correlationId}`;

  await this.temporalService.startWorkflow('placeOrderWorkflow', args, { workflowId });
  ```

## 🚧 Boundary: Temporal Workflows & Activities

The CLS-based `correlationId` propagation **stops at the Temporal boundary**. Be aware of this limitation:

- Workflows and Activities are executed by the Temporal worker, **NOT** through the RabbitMQ pipeline, so `RmqContextInterceptor` does not run and **CLS has no `correlationId` inside workflow/activity code**.
- The only link back to the originating request is the `correlationId` **embedded in the `workflowId`** (e.g. `place-order:{correlationId}`), searchable on the Temporal Web UI — NOT via a `{correlationId="..."}` query in Loki for activity logs.
- Consequently, a single order maps to two separate views: (1) Loki logs (gateway + RPC service, keyed by `correlationId`) and (2) Temporal UI (workflow + activities, keyed by `workflowId`). The `correlationId` inside `workflowId` is the manual bridge between them.
- If activity-level logs must carry the `correlationId`, either pass it explicitly as a workflow/activity argument, or derive it from `workflowInfo().workflowId` and `clsService.set()` it at the start of the activity.

> See `observability-conventions.md` for the logging/metrics stack (Pino → Loki, Prometheus, Grafana) and the separate Temporal SDK logger.

## ⚠️ Development Rules (Checklist)

When developing or modifying services in this monorepo, you MUST adhere to the following rules:

1. **Never generate new UUIDs mid-flow** to identify a process if a `correlationId` already exists in CLS. Use `cls.get('correlationId')`.
2. **Always register `RmqContextInterceptor`** as an `APP_INTERCEPTOR` (via `{ provide: APP_INTERCEPTOR, useClass: RmqContextInterceptor }`) in the root module of any NestJS microservice that consumes RabbitMQ messages.
3. **Always inject `ClsService`** when generating unique IDs for Temporal Workflows rather than using `Date.now()`.
4. **Do NOT pass the Correlation ID as a DTO property.** It should remain abstract and handled by Interceptors and CLS.

