import { SystemErrorCode } from '@libs/contract/base';
import { InjectRedis } from '@nestjs-redis/client';
import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import type { RedisClientType } from 'redis';
import { Observable, of } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import { IDEMPOTENT_KEY } from '../decorator/idempotent.decorator';

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
    private readonly clsService: ClsService,
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
      throw new BadRequestException('X-Idempotency-Key header is required', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_REQUIRED,
      });
    }

    if (!isUUID(idempotencyKey, 4)) {
      this.logger.warn('X-Idempotency-Key header is invalid');
      throw new BadRequestException('X-Idempotency-Key header is invalid', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_INVALID,
      });
    }

    return idempotencyKey;
  }

  /**
   * Generates a Redis cache key and SHA-256 hash of the request body.
   */
  private createCacheKeyAndHash(request: Request, idempotencyKey: string): { cacheKey: string; bodyHash: string } {
    const userId: number | undefined = this.clsService.get<number | undefined>('userId');
    const cacheKey: string = `idempotency:${userId}:${request.method}:${request.url}:${idempotencyKey}`;
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
      throw new BadRequestException('Please retry your request', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_NOT_FOUND,
      });
    }

    if (cachedValue === 'PROCESSING') {
      this.logger.warn('Request is already being processed');
      throw new ConflictException('Request is already being processed', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_CONFLICT,
      });
    }

    const parsedCache: TCachePayload = JSON.parse(cachedValue);

    if (parsedCache.bodyHash !== bodyHash) {
      this.logger.error('Payload mismatch: You cannot change the request body for an existing Idempotency-Key');
      throw new BadRequestException('Payload mismatch: You cannot change the request body for an existing Idempotency-Key', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_PAYLOAD_MISMATCH,
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
      concatMap(async (responseData: any) => {
        const cachePayload: TCachePayload = {
          bodyHash,
          body: responseData,
        };
        this.logger.log(`Cache payload: ${cachePayload.bodyHash}`);

        try {
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
        } catch (err: unknown) {
          this.logger.error('Redis cache set error:', err);
        }

        return responseData;
      }),
      catchError(async (err: unknown) => {
        // Release Redis lock on failure so client can retry
        try {
          const result: number = await this.redisClient.del(cacheKey);
          this.logger.log(`Redis delete result: ${result}`);
        } catch (error: unknown) {
          this.logger.error('Redis delete error:', error);
        }

        throw err;
      }),
    );
  }
}

type TCachePayload = {
  bodyHash: string;
  body: any;
};
