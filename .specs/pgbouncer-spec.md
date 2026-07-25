# Specification: PostgreSQL Connection Pooling with PgBouncer

## 🎯 Overview

This specification documents the architecture, rationale, configuration, and setup of **PgBouncer** as a lightweight database connection pooler in front of PostgreSQL for high-traffic production environments.

---

## ❓ Rationale & Problem Statement

### 💥 Direct Connection Bottleneck in Microservices Architecture
In our monorepo setup:
1. We have 6 database-backed microservices (`order-service`, `inventory-service`, `payment-service`, `product-service`, `shipping-service`, `user-service`).
2. When scaling out in Production (e.g., 5 Pods per service), there are 30 total application instances.
3. If each TypeORM DataSource configures `poolSize: 20`, the total direct connections attempted to PostgreSQL will be $30 \times 20 = \mathbf{600\text{ connections}}$.

### ⚡ PostgreSQL Resource Impact
- Each backend process in PostgreSQL consumes **2MB – 10MB of RAM** for connection overhead alone, plus CPU context-switching costs.
- PostgreSQL's default `max_connections` limit is 100.
- Exceeding this limit causes fatal runtime crashes (`FATAL: sorry, too many clients already`).

---

## 🚀 Solution: PgBouncer

**PgBouncer** acts as a lightweight proxy between microservice application pods and PostgreSQL:
- **Connection Multiplexing**: Thousands of client connections from TypeORM connect to PgBouncer.
- **Minimal Real DB Connections**: PgBouncer maintains a small, fixed pool (e.g., 20-30 real connections) to PostgreSQL.
- **Transaction Pooling (`POOL_MODE=transaction`)**: Reuses server connections as soon as a transaction finishes, perfect for stateless microservices.

---

## 🛠️ Configuration & Setup Guide

### 1. Infrastructure Setup (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: pgbouncer
    ports:
      - "6432:6432"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - POOL_MODE=transaction
      - MAX_CLIENT_CONN=2000
      - DEFAULT_POOL_SIZE=30
      - RESERVE_POOL_SIZE=10
    depends_on:
      - postgres
```

### 2. Service Configuration (`.env`)

Update the database port in production configuration to point to the PgBouncer port (`6432` instead of `5432`):

```env
DB_HOST="localhost"
DB_PORT="6432" # Route connections through PgBouncer
```

---

## ⚠️ Key Considerations

1. **Transaction Pool Mode**: Ensure TypeORM DataSources use transaction-compatible settings.
2. **Health Monitoring**: Monitor PgBouncer connection stats via administrative SQL commands (`SHOW POOLS;`, `SHOW STATS;`).
