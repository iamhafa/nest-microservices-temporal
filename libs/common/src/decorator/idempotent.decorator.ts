import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { randomUUID } from 'crypto';

export const IDEMPOTENT_KEY: string = 'IDEMPOTENT';

export const Idempotent = (): MethodDecorator => {
  return applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, true),
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
