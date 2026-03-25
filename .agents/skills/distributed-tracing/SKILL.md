---
name: distributed-tracing
description: Rules and architectural flow for Correlation ID, Logging, and Context Propagation across Microservices, API Gateway, RabbitMQ, and Temporal.
---

# Distributed Tracing & Observability

## 🔍 Architecture Overview

This NestJS Microservices project uses a **Distributed Tracing** architecture based on a persistent `correlationId`. This ID ensures that a single request can be tracked across the API Gateway, RabbitMQ message brokers, individual Microservices, and Temporal workflows.

## 📦 Core Components

1. **`nestjs-cls` (Continuation-Local Storage):** Used to hold the `correlationId` in memory (RAM) and scope it to the lifecycle of a single request or message execution context.
2. **RabbitMQ Headers (`x-correlation-id`):** Used to transport the `correlationId` over the network between services.
3. **Pino Logger (`nestjs-pino`):** Automatically injects the `correlationId` into every JSON log output.
4. **Temporal Workflows:** Uses the `correlationId` as part of the `workflowId` to enable easy searching on the Temporal Web UI.

## 🔄 The Correlation ID Flow

### 1. API Gateway (Entry Point)
- When an HTTP request arrives, the API Gateway checks for an existing `x-correlation-id` header.
- If none exists, it generates a fresh UUID.
- It stores this ID in the CLS context: `cls.set('correlationId', id)`.
- **Rule:** The Gateway MUST pass this ID in the message headers when publishing to RabbitMQ.

### 2. RabbitMQ (Transport Layer)
- The Correlation ID cannot travel through the network via CLS. It is transported inside the RabbitMQ message properties under `headers: { 'x-correlation-id': '...' }`.

### 3. Microservice (Consumer)
- When a Microservice (e.g., `order-service`, `product-service`) consumes a message, the `RmqCorrelationIdInterceptor` is triggered.
- It extracts the `x-correlation-id` from the RabbitMQ message properties.
- It wraps the execution context using `clsService.run()` and injects the ID: `clsService.set('correlationId', correlationId)`.
- **Rule:** ALL async handlers and services called downstream within this message context will now share the same `correlationId`.

### 4. Logging & Operations
- **Centralized Logging:** The `SharedLoggerModule` uses a `pinoHttp` customProps factory to read `cls.get('correlationId')`. Every `logger.info()` or `logger.error()` will automatically include this ID.
- **Temporal Workflow Initialization:** When a service starts a workflow, it MUST extract the `correlationId` and append it to the `workflowId` to maintain traceability.
  ```typescript
  // Example rule for starting Temporal Workflows
  const correlationId = this.clsService.get('correlationId');
  const workflowId = `place-order-${correlationId}`;
  
  await this.temporalService.startWorkflow('placeOrderWorkflow', args, { workflowId });
  ```

## ⚠️ Development Rules (Checklist)

When developing or modifying services in this monorepo, you MUST adhere to the following rules:

1. **Never generate new UUIDs mid-flow** to identify a process if a `correlationId` already exists in CLS. Use `cls.get('correlationId')`.
2. **Always include `RmqCorrelationIdInterceptor`** in the `PROVIDERS` of any NestJS microservice module that consumes RabbitMQ messages.
3. **Always inject `ClsService`** when generating unique IDs for Temporal Workflows rather than using `Date.now()`.
4. **Do NOT pass the Correlation ID as a DTO property.** It should remain abstract and handled by Interceptors and CLS.
