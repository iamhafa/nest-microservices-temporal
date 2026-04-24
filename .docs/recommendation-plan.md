# Feature: Personalized "For You" Recommendations

This plan outlines the architecture and implementation steps to build the autonomous, AI-driven "For You" recommendation system using User Preference Vectors.

## Proposed Architecture (Event-Driven using RabbitMQ)

We will store user interactions and the current Preference Vector inside `user-service`, since it is part of the user's behavioral profile. However, `recommendation-service` will handle the mathematical algorithm to ensure separation of concerns.

**Workflow for Tracking (`track-interaction-event` via RabbitMQ):**

1. **Frontend/Gateway View:** API Gateway explicitly emits `track-interaction-event` when a user interacts (e.g. `VIEW`).
2. **Backend Event-Driven (Silent Tracking):** `order-service` implicitly loops through cart items and emits `track-interaction-event` when a successful `ORDER` is completed.
3. `recommendation-service` listens to the event via `@EventPattern`.
4. `recommendation-service` fetches the `embedding` of the `productId` from `product-service`.
5. `recommendation-service` fetches the user's current `preference_vector` and `preference_weight` from `user-service`.
6. `recommendation-service` calculates the new vector: `New_Vector = (Old_Vector * Total_Weight + New_Embedding * Interaction_Weight) / (Total_Weight + Interaction_Weight)`.
7. `recommendation-service` sends a command to `user-service` to save the interaction history and update the user's `preference_vector` in one transaction.

**Workflow for Recommendations (`GET /recommendations/for-you`):**

1. API Gateway calls `recommendation-service`.
2. `recommendation-service` fetches the user's `preference_vector` from `user-service`.
3. If the vector exists (User has history), `recommendation-service` passes the vector to `product-service`'s `search-products-by-vector` which utilizes `pgvector` operators to sort results.
4. If the vector is null (Cold Start), `recommendation-service` requests `get-trending-products` from `product-service`.

## Technical Specifications

### 1. External Dependencies (`user-service`)

- Execute `CREATE EXTENSION IF NOT EXISTS vector;` on the `nest-temporal-user-service` database. (Use TypeORM `onModuleInit`).

### 2. Entities & Repositories (`user-service`)

- Create `UserInteractionEntity`: `id`, `user_id`, `product_id`, `interaction_type`, `weight`, `created_at_utc`
- Add to `UserEntity`: `preference_vector` (vector(384)), `preference_weight` (float).
- Methods in `UserService`: `get-user-preference`, `save-user-interaction`.

### 3. Product Service Updates (`product-service`)

- `searchProductsByVector(vector: string, limit: number)`: uses `pgvector` distance `<=>`.
- `getTrendingProducts(limit: number)`: returns most recently created/updated active products for new users.
- `getProductEmbedding`: Returns product ID array representation of vector.

### 4. Recommendation Service Logic (`recommendation-service`)

- Connect `USER_SERVICE_CLIENT`.
- Implement `trackInteraction` using Math formula mapping types (`VIEW`, `CART`, `ORDER`) to proper weights.
- Implement `getForYouRecommendations` using the logic defined above.

### 5. API Gateway (`api-gateway`)

- Add `POST /recommendations/interactions` -> `emit("track-interaction-event")`.
- Add `GET /recommendations/for-you` -> `send("get-for-you-products")`.

### 6. Order Service Background Tracking (`order-service`)

- Config `RECOMMENDATION_SERVICE_CLIENT`.
- In `OrderActivity.createOrder`, emit interaction tracking events silently.

### 7. Shared Contracts (`libs/contract`)

- `CreateInteractionDto` (productId, type).
- `InteractionType` (VIEW, CART, ORDER, SEARCH).
