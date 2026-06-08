import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'public';

export const Public = (): MethodDecorator => SetMetadata(IS_PUBLIC_KEY, true);
