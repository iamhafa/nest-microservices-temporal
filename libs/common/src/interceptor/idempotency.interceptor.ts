import { SystemErrorCode } from '@libs/contract/base';
import { InjectRedis } from '@nestjs-redis/client';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import type { RedisClientType } from 'redis';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IDEMPOTENT_KEY } from '../decorator/idempotent.decorator';
import { AppException } from '../filter/exception/app-exception';

/**
 * Intercepts HTTP requests to ensure idempotency using Redis.
 * Prevents duplicate processing of mutation requests by checking the `X-Idempotency-Key` header.
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

    const idempotencyKey: string = this.validateIdempotencyHeader(request.header('X-Idempotency-Key'));
    const { cacheKey, bodyHash } = this.createCacheKeyAndHash(request, idempotencyKey);

    // Atomic Lock: Set key with value "PROCESSING" and TTL 120s if key does not exist
    const isNewRequest: string | null = await this.redisClient.set(cacheKey, 'PROCESSING', {
      condition: 'NX', // Only set the key if it does not already exist
      expiration: {
        type: 'EX', // Expire the key after 120 seconds
        value: 120, // 120 seconds
      },
    });

    if (isNewRequest !== 'OK') {
      this.logger.log(`Duplicate place order request with key ${idempotencyKey} and return cached response`);
      return this.handleDuplicateRequest(cacheKey, bodyHash, idempotencyKey, response);
    }

    this.logger.log(`New place order request with key ${idempotencyKey}`);
    return this.executeAndCacheNewRequest(next, cacheKey, bodyHash, idempotencyKey, response);
  }

  /**
   * Validates the presence and UUID v4 format of the X-Idempotency-Key header.
   */
  private validateIdempotencyHeader(idempotencyKey?: string): string {
    if (!idempotencyKey) {
      this.logger.warn('X-Idempotency-Key header is required');
      throw new AppException({
        code: SystemErrorCode.IDEMPOTENCY_KEY_REQUIRED,
        status: HttpStatus.BAD_REQUEST,
        message: 'X-Idempotency-Key header is required',
      });
    }

    if (!isUUID(idempotencyKey, 4)) {
      this.logger.warn('X-Idempotency-Key header is invalid');
      throw new AppException({
        code: SystemErrorCode.IDEMPOTENCY_KEY_INVALID,
        status: HttpStatus.BAD_REQUEST,
        message: 'X-Idempotency-Key header is invalid',
      });
    }

    return idempotencyKey;
  }

  /**
   * Generates a Redis cache key and SHA-256 hash of the request body.
   */
  private createCacheKeyAndHash(request: Request, idempotencyKey: string): { cacheKey: string; bodyHash: string } {
    const cacheKey: string = `idempotency:${request.method}:${request.url}:${idempotencyKey}`;
    const stringifiedBody: string = JSON.stringify(request.body ?? {});

    /**
     * @description Why we need bodyHash?
     * - To check if the request body is the same
     * - If the request body is different, the bodyHash will be different
     */
    const bodyHash: string = createHash('sha256').update(stringifiedBody).digest('hex');

    return { cacheKey, bodyHash };
  }

  /**
   * Handles duplicate requests by verifying cached state or throwing conflict/mismatch errors.
   */
  private async handleDuplicateRequest(
    cacheKey: string,
    bodyHash: string,
    idempotencyKey: string,
    response: Response,
  ): Promise<Observable<any>> {
    const cachedValue: string | null = await this.redisClient.get(cacheKey);

    if (!cachedValue) {
      this.logger.warn('Please retry your request');
      throw new AppException({
        code: SystemErrorCode.IDEMPOTENCY_KEY_NOT_FOUND,
        message: 'Please retry your request',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    if (cachedValue === 'PROCESSING') {
      this.logger.warn('Request is already being processed');
      throw new AppException({
        code: SystemErrorCode.IDEMPOTENCY_KEY_CONFLICT,
        message: 'Request is already being processed',
        status: HttpStatus.CONFLICT,
      });
    }

    const parsedCache: TCachePayload = JSON.parse(cachedValue);

    if (parsedCache.bodyHash !== bodyHash) {
      this.logger.error('Payload mismatch: You cannot change the request body for an existing Idempotency-Key');
      throw new AppException({
        code: SystemErrorCode.IDEMPOTENCY_KEY_PAYLOAD_MISMATCH,
        message: 'Payload mismatch: You cannot change the request body for an existing Idempotency-Key',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    response.setHeader('X-Idempotency-Key', idempotencyKey);
    return of(parsedCache.body);
  }

  /**
   * Executes the downstream handler and caches the successful response in Redis for 24 hours.
   */
  private executeAndCacheNewRequest(
    next: CallHandler,
    cacheKey: string,
    bodyHash: string,
    idempotencyKey: string,
    response: Response,
  ): Observable<any> {
    response.setHeader('X-Idempotency-Key', idempotencyKey);

    return next.handle().pipe(
      tap(async (responseData: any) => {
        const cachePayload: TCachePayload = {
          bodyHash,
          body: responseData,
        };
        this.logger.log(`Cache payload: ${cachePayload.bodyHash}`);

        // Cache completed response for 24 hours (86,400 seconds)
        const redisResponse: string | null = await this.redisClient.set(cacheKey, JSON.stringify(cachePayload), {
          condition: 'XX', // Chỉ set nếu key đã tồn tại (chính là key đang được xử lý)
          expiration: {
            type: 'EX', // Loại thời gian sống (expiration time)
            value: 86400, // 24 hours in seconds
          },
        });

        this.logger.log(`Cache completed response: ${redisResponse}`);

        if (redisResponse === null) {
          this.logger.error('Error: Cache completed response failed');
        }
      }),
      catchError(async (err: unknown) => {
        // Release Redis lock on failure so client can retry
        try {
          const result: number = await this.redisClient.del(cacheKey);
          this.logger.log(`Redis delete result: ${result}`);
        } catch (error: unknown) {
          this.logger.error('Redis delete error:', error);
        }
        return throwError(() => err);
      }),
    );
  }
}

type TCachePayload = {
  bodyHash: string;
  body: Record<string, string>;
};
