---
trigger: model_decision
description: Observability stack conventions - Pino logging to Loki, Prometheus metrics, Grafana, and the separate Temporal SDK logger. Complements centralized-log-conventions.md (correlationId).
---

# Observability Conventions (Logs, Metrics, Dashboards)

This project ships a self-hosted observability stack. `correlationId` propagation is covered in `centralized-log-conventions.md`; this rule covers the logging/metrics infrastructure and its architectural constraints.

## 🧱 Infrastructure (docker-compose.yml)

| Container | Purpose | Host port |
| --------- | ------- | --------- |
| `loki` | Log aggregation backend | 3100 |
| `prometheus` | Metrics scraping/storage (config: `.infrastructure/prometheus/prometheus-config.yml`) | 9090 |
| `grafana` | Dashboards for logs + metrics (datasources provisioned in `.infrastructure/grafana/grafana-config.yml`) | 3001 |

- Grafana/Prometheus/Loki talk to each other by **service name** on the Docker network (e.g. `http://prometheus:9090`, `http://loki:3100`, `database:5432`), NEVER `localhost` (localhost inside a container = the container itself).
- Grafana does NOT need outbound internet. Import dashboards by pasting/uploading JSON, not by grafana.com ID (blocked behind corporate proxy).

## 📝 Logging (Pino to Loki)

- Logging uses `nestjs-pino`, configured in `SharedLoggerModule.forRoot({ serviceName })` (`libs/common/src/logger`).
- **Transport is gated by `NODE_ENV`:** development uses `pino-pretty` (console); non-development ships JSON to Loki via `pino-loki` using the `LOKI_URL` env var (must include scheme, e.g. `http://localhost:3100`).
- Every log record is auto-tagged with `correlationId` (from CLS mixin) and a `service`/`serviceName` label.
- `/metrics` requests are excluded from access logging (`autoLogging.ignore`).

**Rules:**
1. Never use `console.log` in app code; use the NestJS `Logger` (routed to Pino via `app.useLogger`).
2. Set a meaningful `serviceName` per app when wiring `SharedLoggerModule` so Loki can filter by service.
3. `LOKI_URL` MUST include the `http://` scheme.

## 📊 Metrics (Prometheus)

- Metrics use `@willsoto/nestjs-prometheus` (+ `prom-client`).
- **Only `api-gateway` currently exposes metrics** at `/metrics`, served on its HTTP server (port 3000). Because the gateway sets a global prefix `api` (with `exclude: ['metrics','health']`) and URI versioning, the effective scrape path is `/v1/metrics`.
- `defaultMetrics.enabled` is tied to `isProduction()` (process/CPU/RAM/event-loop/GC metrics only in production).
- `/metrics` is bypassed by `JwtAuthGuard`, the throttler, and the response interceptor.

### ⚠️ Architectural constraint: RPC / worker services have NO HTTP server

The 7 non-gateway services (`user`, `product`, `order`, `payment`, `shipping`, `inventory`, `orchestrator-worker`) bootstrap with `app.init()` (RabbitMQ consumers / Temporal workers) and **do not listen on an HTTP port**. Prometheus is pull-based, so they are NOT scrapeable as-is.

To expose metrics for these services you MUST either:
- Open a dedicated HTTP metrics port per service (`app.listen(<port>)` instead of `app.init()`) + add a scrape job in `prometheus-config.yml`, OR
- Use container-level metrics (cAdvisor/node-exporter) once the services are dockerized (infra metrics only, no app-level metrics).

Do NOT assume a new service is scrapeable just because it imports a Prometheus module - confirm it actually listens on a port.

## 🌀 Temporal uses a SEPARATE logger (not Pino)

A Temporal worker process has THREE distinct log streams - do not assume all logs go to Pino/Loki:

| Stream | Source | Goes through Pino? |
| ------ | ------ | ------------------ |
| App logs (bootstrap, modules, activities via NestJS `Logger`) | `@nestjs/common` Logger -> Pino | Yes |
| `nestjs-temporal-core` library logs (init, worker discovery) | internal `TemporalLogger` -> NestJS Logger | Yes |
| Temporal SDK Core logs (`[INFO] Worker state changed { sdkComponent: 'worker' }`) | `@temporalio/worker` Runtime (Rust core) | No (default logger) |
| Workflow `console.log` | Temporal workflow sink | No |

- `nestjs-temporal-core` has NO option to pass a Pino instance directly; only `enableLogger`/`logLevel`.
- To route SDK Core logs into Pino, call `Runtime.install({ logger })` from `@temporalio/worker` at the very top of `main.ts`, BEFORE any worker is created.
- Workflow code is sandboxed/deterministic: it cannot use Pino/CLS/DI - use the Temporal workflow logger or a worker sink instead.

## ✅ Verification Gates

Before completing observability work, verify:
- [ ] `LOKI_URL` includes the `http://` scheme and logging is gated by `NODE_ENV`.
- [ ] Any newly "instrumented" service actually listens on an HTTP port for `/metrics` (or is covered by container-level metrics).
- [ ] Grafana datasources/dashboards reference containers by service name, not `localhost`.
- [ ] No `console.log` in app code; NestJS `Logger` used instead.
