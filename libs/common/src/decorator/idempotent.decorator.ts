import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY: string = 'IDEMPOTENT';
export const Idempotent = (): MethodDecorator => SetMetadata(IDEMPOTENT_KEY, true);
