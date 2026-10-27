---
trigger: model_decision
description: Conventions for resilience and fault tolerance using @nestjs/resilience, circuit breakers, local/global retry strategies, and external API integrations.
---

# Resilience & Fault Tolerance Conventions

To ensure system stability and graceful degradation, services interacting with external APIs (Stripe, shipping carriers, external microservices) or critical operations MUST adhere to the `@nestjs/resilience` patterns.

## 🛡 Architectural Separation: Service vs Activity

1. **Domain & Resilience in Service Layer**:
   - Resilience policies (`@CircuitBreaker`, `@Retry`, `@Timeout`) belong in the service layer (`<service-name>.service.ts`) using `@nestjs/resilience` (`ResilienceService` presets or method decorators).
   - The service handles all external SDK calls, idempotency checks, database transactions, and error classification.

2. **Temporal Activity as Thin Adapter**:
   - Temporal Activity classes (`<action>.activity.ts`) remain lightweight adapters implementing the activity interface from `@libs/temporal`.
   - Activities delegate execution directly to the service provider.

```mermaid
flowchart LR
    Temporal[Temporal Worker] --> Activity[Temporal Activity<br/>Thin Adapter]
    Activity --> Service[Service Provider<br/>@nestjs/resilience]
    Service --> Ext[External API / Stripe]
```

---

## ⚡ Configuration Patterns (@nestjs/resilience)

### 1. Module Registration (`ResilienceModule.forRoot`)

Register presets in `<service-name>.module.ts`:

```typescript
ResilienceModule.forRoot({
  presets: {
    stripe: {
      circuitBreaker: {
        name: 'stripe-circuit-breaker',
        failureRateThreshold: 50, // 50% failure rate trips the breaker
        minimumCalls: 5,          // Minimum calls before calculating failure rate
        openDuration: '30s',      // Cooldown period in Open state
        halfOpenMaxCalls: 1,      // 1 probe call during Half-Open
      },
      retry: {
        attempts: 2,              // 2 local micro-attempts
        backoff: { delay: '500ms', maxDelay: '2s' },
      },
      timeout: '10s',             // 10s timeout per attempt
    },
  },
}),
```

### 2. Service Execution (`ResilienceService.preset`)

```typescript
@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly stripePolicy: ResiliencePolicy;

  constructor(
    private readonly resilienceService: ResilienceService,
    private readonly resilienceEvents: ResilienceEvents,
  ) {
    this.stripePolicy = this.resilienceService.preset('stripe');
  }

  onModuleInit() {
    this.resilienceEvents.events$.subscribe((event) => {
      if (event.type === 'circuit-open') {
        this.logger.warn(`--- [${event.policy}] Circuit Breaker OPEN! ---`);
      } else if (event.type === 'circuit-closed') {
        this.logger.log(`--- [${event.policy}] Circuit Breaker CLOSED! ---`);
      }
    });
  }

  async chargePayment(...) {
    try {
      return await this.stripePolicy.execute(() => this.stripeClient.paymentIntents.create(...));
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        throw new ServiceUnavailableException('Stripe service is temporarily unavailable (Circuit Breaker)');
      }
      if (error instanceof ResilienceTimeoutError) {
        throw new ServiceUnavailableException('Stripe request timed out');
      }
      throw error;
    }
  }
}
```

---

## 🔄 Hybrid Retry Strategy (Local vs Global)

Always balance local micro-retries with Temporal's macro-retries:

| Strategy | Engine | Target | Scope & Timing |
| :--- | :--- | :--- | :--- |
| **Local Micro-Retry** | `@nestjs/resilience` | Transient network glitches, 5xx | 1–3 attempts within 1–2 seconds. Fast recovery without rescheduling Temporal activity. |
| **Global Macro-Retry** | Temporal Workflow | Prolonged outages, downstream downtime | Backoff over minutes/hours with persistent workflow state. |

> [!CRITICAL]
> **Timeout Constraint**: The total local retry + timeout budget inside `@nestjs/resilience` (`attempts * timeout + backoff`) MUST BE STRICTLY LESS than the Temporal Activity's `startToCloseTimeout` (typically 30s). If local retries exceed `startToCloseTimeout`, Temporal will prematurely abort the activity task.
