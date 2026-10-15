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
        condition: 'NX',
        expiration: {
          type: 'PX',
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
    throw new InternalServerErrorException(
      `Idempotency key "${key}" kept changing; please retry.`,
      SystemErrorCode.IDEMPOTENCY_KEY_KEPT_CHANGING,
    );
  }

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
        type: 'PX',
        value: ttl,
      },
    });
    if (!setResult) {
      this.logger.error(`Failed to complete idempotency key "${key}"`);
      return false;
    }

    return true;
  }

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
 * Cấu trúc dữ liệu của một bản ghi Idempotency được lưu trữ trong Redis.
 */
type TIdempotencyRecord = {
  /**
   * Trạng thái vòng đời của request:
   * - 'in-flight': Request đang được xử lý (đang giữ lock). Nếu có request trùng key gửi tới lúc này,
   *                hệ thống trả về HTTP 409 (IDEMPOTENCY_KEY_IN_USE) kèm header Retry-After.
   * - 'completed': Request đã hoàn thành thành công và có kết quả lưu trữ. Mọi request trùng key gửi
   *                tới sau đó sẽ được replay kết quả cũ (HTTP status, headers, body) mà không chạy lại handler.
   */
  state: IdempotencyAcquireResult['state'];

  /**
   * Fencing Token (Định danh tiến trình giữ lock):
   * - Một chuỗi ngẫu nhiên (UUID) sinh ra cho mỗi lần gọi để phân biệt giữa các lần thử (attempt).
   * - Dùng để ngăn chặn race condition: Một tiến trình bị lag/treo quá thời gian lockTtl sẽ bị mất quyền
   *   sở hữu. Khi nó tỉnh lại, nó chỉ được phép extend/complete/release nếu `owner` vẫn khớp với token của nó,
   *   tránh việc vô tình xóa hoặc ghi đè lock của một retry khác vừa chiếm quyền.
   * - Khi request đã 'completed', owner có thể bỏ trống (undefined).
   */
  owner?: string;

  /**
   * Dấu vân tay của Request (SHA-256 hash):
   * - Được băm từ `scope + HTTP method + URL + request body` (đã chuẩn hóa sắp xếp key).
   * - Dùng để phát hiện Payload Mismatch: Nếu client gửi cùng 1 Idempotency-Key nhưng lại thay đổi
   *   body hoặc gọi vào URL khác, hệ thống so sánh fingerprint thấy khác nhau và từ chối với
   *   HTTP 422 (IDEMPOTENCY_KEY_REUSED).
   */
  fingerprint: string;

  /**
   * Snapshot kết quả phản hồi của Request:
   * - Chứa HTTP status code, allowlisted headers, và response body từ lần gọi ban đầu (hoặc chuỗi
   *   đã mã hóa nếu bật AES-256 encryption).
   * - Chỉ tồn tại khi `state === 'completed'`.
   * - Dùng để tái hiện (replay) y nguyên phản hồi cho client ở các lần retry tiếp theo.
   */
  response?: IdempotencyStoredPayload;
};
