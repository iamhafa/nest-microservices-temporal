import { SystemErrorCode } from '@libs/contract/base';
import { InjectRedis } from '@nestjs-redis/client';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { IdempotencyAcquireResult, IdempotencyStorage, IdempotencyStore, IdempotencyStoredPayload } from '@nestjs/idempotency';
import type { RedisClientType } from 'redis';

/**
 * Custom IdempotencyStore using native commands from `@nestjs-redis/client`.
 * Manages atomic locking via `SET NX PX`, fencing tokens via `owner`,
 * and automatic TTL expiration.
 */
@Injectable()
export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly logger: Logger = new Logger(RedisIdempotencyStore.name);
  private readonly prefix: string = 'idempotency:';
  private readonly maxRetries: number = 5;

  constructor(
    protected readonly storage: IdempotencyStorage,
    @InjectRedis() private readonly redisClient: RedisClientType,
  ) {
    storage.registerSource(this);
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Acquires execution lock (if new key) or returns stored state/result (if key exists)
  async acquire(key: string, owner: string, fingerprint: string, lockTtl: number): Promise<IdempotencyAcquireResult> {
    const fullKey: string = this.getKey(key);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const record: TIdempotencyRecord = {
        state: 'in-flight',
        owner,
        fingerprint,
      };

      // Atomic lock via SET NX PX in @nestjs-redis/client
      const setResult = await this.redisClient.set(fullKey, JSON.stringify(record), {
        condition: 'NX', // Only execute SET if key does not already exist
        expiration: {
          type: 'PX', // 'PX': Expiry time in milliseconds (Period in Milliseconds), matches lockTtl (ms)
          value: lockTtl,
        },
      });

      if (setResult === 'OK') {
        return {
          state: 'acquired',
        };
      }

      // Key already exists -> inspect current state
      const rawData = await this.redisClient.get(fullKey);

      if (rawData) {
        const parsed: TIdempotencyRecord = JSON.parse(rawData);
        if (parsed.state === 'completed' && parsed.response) {
          return {
            state: 'completed',
            fingerprint: parsed.fingerprint,
            response: parsed.response,
          };
        } else {
          return {
            state: 'in-flight',
            fingerprint: parsed.fingerprint,
          };
        }
      }
      // If rawData is null, key expired between set and get; retry in loop
    }

    this.logger.error(`Idempotency key "${key}" kept changing; please retry.`);
    throw new InternalServerErrorException(`Idempotency key "${key}" kept changing; please retry.`, {
      errorCode: SystemErrorCode.IDEMPOTENCY_KEY_KEPT_CHANGING,
    });
  }

  // Stores completed response in Redis, transitions state to 'completed', and applies retention TTL
  async complete(key: string, owner: string, response: IdempotencyStoredPayload, ttl: number): Promise<boolean> {
    const fullKey: string = this.getKey(key);
    const rawData = await this.redisClient.get(fullKey);
    if (!rawData) {
      this.logger.error(`Failed to complete idempotency key "${key}"`);
      return false;
    }

    const parsed: TIdempotencyRecord = JSON.parse(rawData);
    // Fencing token check: only complete if still owned by this attempt and in-flight
    if (parsed.state !== 'in-flight' || parsed.owner !== owner) {
      this.logger.error(`Failed to complete idempotency key "${key}" because it is not in-flight or not owned by this attempt`);
      return false;
    }

    const completedRecord: TIdempotencyRecord = {
      state: 'completed',
      fingerprint: parsed.fingerprint,
      response,
    };

    const setResult = await this.redisClient.set(fullKey, JSON.stringify(completedRecord), {
      expiration: {
        type: 'PX', // 'PX': Expiry time in milliseconds (Period in Milliseconds), matches ttl (ms)
        value: ttl,
      },
    });
    if (!setResult) {
      this.logger.error(`Failed to complete idempotency key "${key}"`);
      return false;
    }

    return true;
  }

  // Releases lock from Redis when request fails (5xx error) so client can retry immediately
  async release(key: string, owner: string): Promise<boolean> {
    const fullKey: string = this.getKey(key);
    const rawData = await this.redisClient.get(fullKey);
    if (!rawData) return false;

    const parsed: TIdempotencyRecord = JSON.parse(rawData);
    // Only release if lock is still in-flight and owned by this attempt
    if (parsed.state !== 'in-flight' || parsed.owner !== owner) {
      this.logger.error(`Failed to release idempotency key "${key}" because it is not in-flight or not owned by this attempt`);
      return false;
    }

    const deletedCount: number = await this.redisClient.del(fullKey);
    if (deletedCount === 0) {
      this.logger.error(`Failed to release idempotency key "${key}"`);
      return false;
    }

    return true;
  }

  // Extends lock expiration (lockTtl) for long-running handler executions
  async extend(key: string, owner: string, lockTtl: number): Promise<boolean> {
    const fullKey: string = this.getKey(key);
    const rawData = await this.redisClient.get(fullKey);
    if (!rawData) return false;

    const parsed: TIdempotencyRecord = JSON.parse(rawData);
    // Only extend if lock is still in-flight and owned by this attempt
    if (parsed.state !== 'in-flight' || parsed.owner !== owner) {
      this.logger.error(`Failed to extend idempotency key "${key}" because it is not in-flight or not owned by this attempt`);
      return false;
    }

    const result: number = await this.redisClient.pExpire(fullKey, lockTtl);

    if (result === 0) {
      this.logger.error(`Failed to extend idempotency key "${key}"`);
      return false;
    }

    return true;
  }
}

/**
 * Data structure of an Idempotency record stored in Redis.
 */
type TIdempotencyRecord = {
  /**
   * Request lifecycle state:
   * - 'in-flight': Request is being processed (holding lock). Duplicate requests receive
   *                HTTP 409 (IDEMPOTENCY_KEY_IN_USE) with Retry-After header.
   * - 'completed': Request completed successfully with cached response. Replay requests
   *                receive the stored result (status, headers, body) without re-executing handler.
   */
  state: IdempotencyAcquireResult['state'];

  /**
   * Fencing Token (Lock holder process identifier):
   * - Random token (UUID) generated per attempt to differentiate between executions.
   * - Prevents race conditions: A stalled process losing lock after lockTtl expiry
   *   cannot overwrite/delete a newer attempt's lock upon recovering.
   * - Unset (undefined) once record is 'completed'.
   */
  owner?: string;

  /**
   * Request Fingerprint (SHA-256 hash):
   * - Hashed from `scope + HTTP method + URL + request body` (with keys sorted alphabetically).
   * - Detects Payload Mismatch: Reusing the same Idempotency-Key with different payload/URL
   *   is rejected with HTTP 422 (IDEMPOTENCY_KEY_REUSED).
   */
  fingerprint: string;

  /**
   * Stored Response Snapshot:
   * - Contains HTTP status, allowlisted headers, and response body (or encrypted string).
   * - Only present when `state === 'completed'`.
   * - Replayed as-is to clients on subsequent retries.
   */
  response?: IdempotencyStoredPayload;
};
