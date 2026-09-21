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
import { hash } from 'crypto';
import { Request, Response } from 'express';
import { canonicalize } from 'json-canonicalize';
import { isNull } from 'lodash';
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
    const { cacheKey, hashedBody } = this.createCacheKeyAndHash(request, idempotencyKey);

    /**
     * Echo lại Idempotency-Key ra response header MỘT LẦN tại đây (thay vì lặp ở từng nhánh xử lý).
     * Nhờ vậy MỌI response đều mang header này - dù là request mới, trả về từ cache, hay khi ném lỗi
     * (conflict / payload mismatch) - giúp client luôn đối chiếu được key đã gửi.
     */
    response.setHeader('X-Idempotency-Key', idempotencyKey);

    const initialPayload: TIdempotencyCache = {
      status: IdempotencyStatus.PROCESSING,
      hashedBody,
    };
    const stringifiedInitialPayload: string = JSON.stringify(initialPayload);

    // Atomic Lock: Set key with status "PROCESSING", hashedBody, and TTL 120s if key does not exist
    const isNewRequest: string | null = await this.redisClient.set(cacheKey, stringifiedInitialPayload, {
      condition: 'NX', // Only set the key if it does not already exist
      expiration: {
        type: 'EX', // Expire the key after 120 seconds
        value: 120, // 120 seconds
      },
    });

    if (isNewRequest !== 'OK') {
      this.logger.log(`Duplicate request with key ${idempotencyKey}`);
      return this.handleDuplicateRequest(cacheKey, hashedBody, idempotencyKey);
    }

    this.logger.log(`New request with key ${idempotencyKey}`);
    return this.executeAndCacheNewRequest(next, cacheKey, hashedBody);
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
  private createCacheKeyAndHash(
    request: Request,
    idempotencyKey: string,
  ): { cacheKey: string } & Pick<TIdempotencyCache, 'hashedBody'> {
    const userId: number | undefined = this.clsService.get<number | undefined>('userId');
    // example: idempotency:1:POST:/api/v1/orders/place:1e9a1a18-91fb-4992-94cf-f16b77f7a7a1
    const cacheKey: string = `idempotency:${userId}:${request.method}:${request.url}:${idempotencyKey}`;

    /**
     * Chuẩn hóa JSON body theo RFC 8785 (JSON Canonicalization Scheme) để 2 payload cùng ngữ nghĩa
     * nhưng khác thứ tự key vẫn tạo ra chuỗi đồng nhất, tránh báo sai lỗi Payload Mismatch.
     * `request.body ?? {}`: đảm bảo luôn có object hợp lệ kể cả body rỗng.
     */
    const canonicalBody: string = canonicalize(request.body ?? {});
    const hashedBody: string = hash('sha256', canonicalBody, 'hex');

    return { cacheKey, hashedBody };
  }

  /**
   * Handles duplicate requests by verifying cached state or throwing conflict/mismatch errors.
   */
  private async handleDuplicateRequest(cacheKey: string, hashedBody: string, idempotencyKey: string): Promise<Observable<any>> {
    const cachedValue: string | null = await this.redisClient.get(cacheKey);

    if (!cachedValue) {
      this.logger.warn('Please retry your request');
      throw new BadRequestException('Please retry your request', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_NOT_FOUND,
      });
    }

    // Convert stringified value to normal JSON format
    const parsedCache: TIdempotencyCache = JSON.parse(cachedValue);

    // 1. Prioritize payload mismatch check
    if (parsedCache.hashedBody !== hashedBody) {
      this.logger.error('Payload mismatch: You cannot change the request body for an existing Idempotency-Key');
      throw new ConflictException('Payload mismatch: You cannot change the request body for an existing Idempotency-Key', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_PAYLOAD_MISMATCH,
      });
    }

    // 2. Check if request is currently being processed
    if (parsedCache.status === IdempotencyStatus.PROCESSING) {
      this.logger.warn('Request is already being processed');
      throw new ConflictException('Request is already being processed', {
        errorCode: SystemErrorCode.IDEMPOTENCY_KEY_CONFLICT,
      });
    }

    // 3. Request completed successfully, return cached response
    this.logger.log(`Idempotent hit: returning cached response for key ${idempotencyKey}, skipping downstream handler`);
    return of(parsedCache.response);
  }

  /**
   * Executes the downstream handler and caches the successful response in Redis for 24 hours.
   */
  private executeAndCacheNewRequest(next: CallHandler, cacheKey: string, hashedBody: string): Observable<any> {
    return next.handle().pipe(
      concatMap(async (responseData: any): Promise<any> => {
        const cachePayload: TIdempotencyCache = {
          status: IdempotencyStatus.COMPLETED,
          hashedBody,
          response: responseData,
        };
        const stringifiedCachePayload: string = JSON.stringify(cachePayload);
        this.logger.log(`Cache payload: ${cachePayload.hashedBody}`);

        try {
          // Cache completed response for 24 hours (86,400 seconds)
          const redisResponse: string | null = await this.redisClient.set(cacheKey, stringifiedCachePayload, {
            condition: 'XX', // Chỉ set nếu key đã tồn tại (chính là key đang được xử lý)
            expiration: { type: 'EX', value: 86400 },
          });

          this.logger.log(`Cache completed response: ${redisResponse}`);
          if (isNull(redisResponse)) {
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

enum IdempotencyStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

type TIdempotencyCache = {
  status: IdempotencyStatus;
  hashedBody: string;
  response?: any;
};
