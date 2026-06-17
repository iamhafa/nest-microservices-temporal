---
name: resilience-conventions
description: Conventions for circuit breakers (cockatiel), local/global retry strategies, and fault tolerance in external service integrations.
---

# Resilience & Fault Tolerance Conventions

To ensure system stability, all services MUST adhere to these resilience patterns when interacting with external APIs or heavy compute tasks.

## 🛡 Circuit Breaker (Cockatiel)

MANDATORY for all external service integrations (Stripe, Shipping Providers, AI APIs).

### 1. Implementation Pattern
- Use functional style `circuitBreaker(handleAll, ...)` for readability.
- **Fail-fast**: Throw `AppException` with `503 Service Unavailable` when circuit is open.

### 2. Standard Configuration
- **Threshold**: 5 consecutive failures.
- **Recovery**: Use `ExponentialBackoff()` for `halfOpenAfter` to prevent constant probing during outages.

## 🔄 Hybrid Retry Strategy (Local vs Global)

Always combine local micro-retries with Temporal's macro-retries.

### 1. Local Retry (Cockatiel)
- **Use for**: Transient network errors (5xx, Timeouts).
- **Limit**: Max 3 attempts within 1-2 seconds.
- **Benefit**: Fixes glitches instantly without rescheduling activities in Temporal.

### 2. Global Retry (Temporal)
- **Use for**: Persistent outages or failures after Local Retry fails.
- **Benefit**: Ensures eventual consistency over minutes/hours.

## 📂 Centralization Rule
- Currently, circuit breakers are defined **locally** inside the respective external-facing activities (e.g. `apps/payment-service/src/activity/charge-payment.activity.ts`) using the `cockatiel` library.
- Moving forward, the goal is to centralize shared resilience policies in `libs/common/src/resilience/` to ensure consistent behavior and unified state tracking across workers.
