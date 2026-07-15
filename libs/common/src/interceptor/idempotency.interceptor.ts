import { SystemErrorCode } from '@libs/contract/base';
import { InjectRedis } from '@nestjs-redis/client';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import type { RedisClientType } from 'redis';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IDEMPOTENT_KEY } from '../decorator/idempotent.decorator';
import { AppException } from '../filter/exception/app-exception';

/**
 * Intercepts HTTP requests to ensure idempotency using Redis.
 * Prevents duplicate processing of mutation requests by checking the `x-idempotency-key` header.
 *
 * - Returns cached response if the request was already processed.
 * - Throws 409 Conflict if the request is currently being processed.
 * - Requires the `@Idempotent()` decorator on the target route handler.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRedis() private readonly redisClient: RedisClientType,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isIdempotent: boolean = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler());
    if (!isIdempotent) return next.handle();

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const idempotencyKey: string | undefined = request.header('X-Idempotency-Key');

    if (!idempotencyKey) {
      this.logger.warn('X-Idempotency-Key header is required');
      throw new AppException({
        code: SystemErrorCode.IDEMPOTENCY_KEY_REQUIRED,
        message: 'X-Idempotency-Key header is required',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const cacheKey: string = `idempotency:${request.method}:${request.url}:${idempotencyKey}`;
    const stringifiedBody: string = JSON.stringify(request.body); // convert body to string to create hash
    const bodyHash: string = createHash('sha256').update(stringifiedBody).digest('hex');

    // Set key with value "PROCESSING" and expiration time 2 minutes (120 seconds) if the key does not exist.
    const isNewRequest: string | null = await this.redisClient.set(cacheKey, 'PROCESSING', {
      expiration: {
        type: 'EX', // Set expiration time in seconds
        value: 120, // 2 minutes to accommodate long workflows
      },
      condition: 'NX', // Only set if the key does not exist
    });

    if (isNewRequest !== 'OK') {
      const cachedValue: string | null = await this.redisClient.get(cacheKey);

      this.logger.warn(`Cached value: ${cachedValue}`);

      if (cachedValue === 'PROCESSING') {
        this.logger.warn('Request is already being processed');
        throw new AppException({
          code: SystemErrorCode.IDEMPOTENCY_KEY_CONFLICT,
          message: 'Request is already being processed',
          status: HttpStatus.CONFLICT,
        });
      }

      if (!cachedValue) {
        this.logger.warn('Please retry your request');
        throw new AppException({
          code: SystemErrorCode.IDEMPOTENCY_KEY_NOT_FOUND,
          message: 'Please retry your request',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      const parsedCache: Record<string, unknown> = JSON.parse(cachedValue);

      if (parsedCache.bodyHash !== bodyHash) {
        this.logger.error('Payload mismatch: You cannot change the request body for an existing Idempotency-Key');
        throw new AppException({
          code: SystemErrorCode.IDEMPOTENCY_KEY_PAYLOAD_MISMATCH,
          message: 'Payload mismatch: You cannot change the request body for an existing Idempotency-Key',
          status: HttpStatus.BAD_REQUEST,
        });
      }

      // Set response header for idempotency key
      response.setHeader('X-Idempotency-Key', idempotencyKey);

      // Return cached response data
      return of(parsedCache.body);
    }

    // Set response header for idempotency key
    response.setHeader('X-Idempotency-Key', idempotencyKey);

    // Handle the request and tap the response
    return next.handle().pipe(
      tap(async (responseData: any) => {
        const cachePayload: Record<string, unknown> = {
          bodyHash: bodyHash,
          body: responseData,
        };

        // Set response data in cache with expiration time 24 hours (86400 seconds)
        await this.redisClient.set(cacheKey, JSON.stringify(cachePayload), {
          condition: 'XX',
          expiration: {
            type: 'EX', // Set expiration time in seconds
            value: 86400, // 24 hours
          },
        });
      }),
      catchError((err: unknown) => {
        this.redisClient.del(cacheKey).catch((e: unknown) => {
          this.logger.error('Redis delete error:', e);
        });
        return throwError(() => err);
      }),
    );
  }
}
