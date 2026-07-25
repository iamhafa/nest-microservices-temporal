# Idempotency Processing Business Flow

## 🎯 Overview

This document describes the request execution flow and deduplication mechanism for Idempotent API endpoints using `@Idempotent()` decorator, `IdempotencyInterceptor`, and Redis.

---

## 📊 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Gateway as API Gateway (IdempotencyInterceptor)
    participant Redis
    participant Saga as Temporal Saga / Worker

    Note over Client,Saga: ─── LẦN 1: ĐẶT HÀNG BAN ĐẦU ───
    Client->>Gateway: POST /orders/place (Header: X-Idempotency-Key)
    Gateway->>Redis: SETNX idempotency:POST:... "PROCESSING" (120s)
    Redis-->>Gateway: OK (Key mới)
    Gateway->>Saga: Kích hoạt Workflow place-order:...
    Saga-->>Gateway: Phản hồi { success: true, workflowId: "place-order:..." }
    Gateway->>Redis: Lưu kết quả Response + BodyHash vào Redis
    Gateway-->>Client: 201 Created

    Note over Client,Saga: ─── LẦN 2: GỬI LẠI VỚI CÙNG KEY (DUPLICATE) ───
    Client->>Gateway: POST /orders/place (Cùng Header X-Idempotency-Key)
    Gateway->>Redis: GET idempotency:POST:...
    Redis-->>Gateway: Trả về Cached Response từ Lần 1
    Note over Gateway: CHẶN LẠI! Không gọi sang RabbitMQ / Temporal
    Gateway-->>Client: Trả về ngay lập tức Cached Response (1ms)
```

Raw diagram file: [.docs/idempotency-flow.mermaid](idempotency-flow.mermaid)
