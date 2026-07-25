import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { randomUUID } from 'crypto';

export const IDEMPOTENT_KEY: string = 'IDEMPOTENT';

/**
 * @description Marks an API route handler for idempotency processing enforced by `IdempotencyInterceptor`.
 *
 * Route handlers decorated with `@Idempotent()` will be intercepted by `IdempotencyInterceptor`
 * to prevent duplicate mutation requests using Redis and the `x-idempotency-key` header.
 */
export const Idempotent = (): MethodDecorator => {
  return applyDecorators(
    // Mark method for idempotency handling using reflector metadata
    SetMetadata(IDEMPOTENT_KEY, true),

    // Configure X-Idempotency-Key header documentation on Swagger UI with an auto-generated sample UUID
    ApiHeader({
      name: 'X-Idempotency-Key',
      description: 'Idempotency key to prevent duplicate requests',
      required: true,
      schema: {
        default: randomUUID(),
        description: 'Auto generated if not provided',
      },
    }),
  );
};
