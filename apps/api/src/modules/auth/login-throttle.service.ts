import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { AppError } from '../../common/errors/app-error.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { REDIS } from '../../infrastructure/redis/redis.module.js';

/**
 * Per-account brute-force protection, complementing per-IP rate limiting: after
 * LOGIN_MAX_FAILURES failed attempts the email is locked for LOGIN_LOCKOUT_MINUTES.
 * Unknown emails are counted the same way, so lockouts reveal nothing.
 */
@Injectable()
export class LoginThrottleService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async assertNotLocked(email: string): Promise<void> {
    const key = this.key(email);
    const failures = Number((await this.redis.get(key)) ?? 0);
    if (failures >= this.config.rateLimit.loginMaxFailures) {
      const retryAfterSeconds = Math.max(1, await this.redis.ttl(key));
      throw AppError.tooManyRequests('ACCOUNT_LOCKED', 'Too many failed sign-in attempts. Try again later.', {
        retryAfterSeconds,
      });
    }
  }

  async recordFailure(email: string): Promise<void> {
    const key = this.key(email);
    await this.redis
      .multi()
      .incr(key)
      .pexpire(key, this.config.rateLimit.loginLockoutMs, 'NX')
      .exec();
  }

  async reset(email: string): Promise<void> {
    await this.redis.del(this.key(email));
  }

  private key(email: string): string {
    const digest = createHash('sha256').update(email.toLowerCase()).digest('hex');
    return `${this.config.queue.prefix}:auth:login-failures:${digest}`;
  }
}
