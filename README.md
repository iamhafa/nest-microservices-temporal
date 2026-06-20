# NestJS Microservices with Temporal

## 🎯 Overview

This project is a scalable, robust **microservices architecture** built with **NestJS** in a monorepo workspace. It leverages **RabbitMQ** for high-performance internal service-to-service communication, **Temporal.io** for orchestrating complex distributed workflows (using the Saga pattern), and **PostgreSQL** with **TypeORM** for data persistence.

## 🚀 Microservices Architecture

| Service                  | Role                                                                | Database | Temporal Activity |
| ------------------------ | ------------------------------------------------------------------- | -------- | ----------------- |
| `api-gateway`            | HTTP entrypoint, routes REST requests to internal services via RMQ. | ❌       | ❌                |
| `order-service`          | Order management (CRUD, status updates).                            | ✅       | ✅                |
| `inventory-service`      | Inventory management (reserve, confirm, release, restore).          | ✅       | ✅                |
| `payment-service`        | Payment processing (charge, refund).                                | ✅       | ✅                |
| `shipping-service`       | Shipment creation and management.                                   | ✅       | ✅                |
| `product-service`        | Product catalog management and validation.                          | ✅       | ✅                |
| `user-service`           | User management and authentication.                                 | ✅       | ❌                |
| `orchestrator-worker`    | Executes Temporal workflows (Saga orchestrator).                    | ❌       | ❌                |

### 📚 Shared Libraries (`libs/`)

- `@libs/common`: Shared utilities, loggers, enums, etc.
- `@libs/contract`: Shared DTOs, data interfaces, and enums for message passing.
- `@libs/temporal`: Centralized Activity interfaces, Task Queues, and Temporal modules.

## 🔗 Communication Flow

1. **Client ↔ API Gateway**: Standard HTTP/REST.
2. **API Gateway ↔ Services**: Message-driven via **RabbitMQ** (Request/Response pattern).
3. **Orchestrator ↔ Services**: **Temporal Activities**. Each service has a dedicated task queue to process workflow steps.

## 🛡️ Core Rules & Patterns

- **Strict Service Isolation**: Services are **NOT ALLOWED** to import files from other services. They may only import from shared `libs` to ensure complete independence.
- **Saga Pattern**: All cross-service operations (e.g., placing an order with payment and inventory updates) MUST use a Temporal workflow to ensure atomicity and manage compensation (rollback) if a step fails.
- **Naming Conventions**: `snake_case` MUST be used for all external payloads (JSON request/response, RabbitMQ messages); `camelCase` is strictly for internal TypeScript code.
- **Database & TypeORM**: Use the **Repository Pattern** for database access. Prioritize query optimization (e.g., `select` specific fields). Use DataSources for transaction management.

## 🛡️ Reliability & Security

- **Idempotent Operations**: Critical activities (e.g., Payment, Inventory) implement idempotency using deterministic keys and database state checks to prevent duplicate processing during Temporal retries.
- **Dead Letter Queues (DLQ)**: RabbitMQ is configured with DLQs and a shared retry mechanism to handle message processing failures gracefully.
- **API Security**: 
    - **Helmet**: Enforces secure HTTP headers and removes the `X-Powered-By` header.
    - **Rate Limiting**: Throttler module protects the API Gateway from brute-force and DDoS attacks.
    - **Trust Proxy**: Configured for accurate client IP detection behind reverse proxies/load balancers.
- **Observability**: **X-Correlation-Id** is propagated across all services for request tracing and debugging.
- **Hybrid Application Pattern**: Microservices use a shared configuration pattern to safely access environment variables during bootstrap.

## 🛠️ Tech Stack

- **Framework:** NestJS (Node.js/TypeScript)
- **Message Broker:** RabbitMQ
- **Workflow Orchestration:** Temporal
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Package Manager:** pnpm

## 🤖 MCP PostgreSQL (AI Database Context)

This project includes **Model Context Protocol (MCP)** configuration for PostgreSQL, allowing AI assistants (e.g., Antigravity, Cursor) to directly query and understand the database schema of each service.

### MCP Servers

| Server Name          | Database                          |
| -------------------- | --------------------------------- |
| `product-postgres`   | `nest-temporal-product-service`   |
| `order-postgres`     | `nest-temporal-order-service`     |
| `inventory-postgres` | `nest-temporal-inventory-service` |
| `payment-postgres`   | `nest-temporal-payment-service`   |

Each server uses the `@modelcontextprotocol/server-postgres` package to provide read-only SQL query capabilities.

### Setup for Antigravity

To enable MCP in **Antigravity**, copy the following content into the global MCP config file:

**File path:** `~/.gemini/antigravity/mcp_config.json`

```json
{
  "mcpServers": {
    "product-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:5432/nest-temporal-product-service"
      ]
    },
    "order-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:5432/nest-temporal-order-service"
      ]
    },
    "inventory-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:5432/nest-temporal-inventory-service"
      ]
    },
    "payment-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:5432/nest-temporal-payment-service"
      ]
    }
  }
}
```

> **Note:** Ensure PostgreSQL is running locally and the databases exist before using MCP queries.

## 🧠 AI-Assisted Development

This project is optimized for AI coding assistants (like **Antigravity** or **Cursor**).
- **.agents/ Rules**: Located in the root directory, these markdown files contain project-specific rules, coding conventions, and workflows that AI models follow to maintain consistency.
- **Workspace Context**: Structured to help agents understand service boundaries and shared library relationships.

## 📦 Run the Project

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v20+) & pnpm

### 2. Infrastructure Setup
```bash
# Start PostgreSQL, RabbitMQ, and Temporal
$ docker-compose up -d
```

### 3. Application Setup
```bash
# Install dependencies
$ pnpm install

# Setup environment variables (refer to .env.example)
$ cp .env.example .env

# Run a specific service in development watch mode
$ pnpm run start:dev <service-name>
# Examples:
# pnpm run start:dev api-gateway
# pnpm run start:dev product-service
# pnpm run start:dev orchestrator-worker
```
