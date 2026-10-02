import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Redis } from 'ioredis';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { REDIS } from '../redis/redis.module.js';
import { RedisThrottlerStorage } from './redis-throttler.storage.js';

/**
 * Per-IP rate limiting for every route (300 requests/minute by default). Sensitive routes
 * tighten it with `@Throttle({ default: { limit, ttl } })`. Counters live in Redis so the
 * limits hold across API instances.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG, REDIS],
      useFactory: (config: AppConfig, redis: Redis) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
        storage: new RedisThrottlerStorage(redis, `${config.queue.prefix}:throttle`),
        skipIf: () => !config.rateLimit.enabled,
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
