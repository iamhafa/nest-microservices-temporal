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
| `shipping-service`       | Shipment creation and management.                                   | ❌       | ✅                |
| `product-service`        | Product catalog management and validation.                          | ✅       | ✅                |
| `recommendation-service` | Product recommendations.                                            | ❌       | ❌                |
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

## 📦 Run the Project

```bash
# Install dependencies
$ pnpm install

# Run a specific service in development watch mode
$ pnpm run start:dev <api-gateway|order-service|...>
```
