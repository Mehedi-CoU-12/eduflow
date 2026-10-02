import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';

/**
 * BullMQ root configuration. Feature modules register their own queues with
 * `BullModule.registerQueue({ name })` and process them with `@Processor(name)`.
 * Side effects such as email and notifications always go through a queue, never
 * straight from a controller.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        // Workers use blocking commands, which require maxRetriesPerRequest: null.
        connection: { url: config.redis.url, maxRetriesPerRequest: null },
        prefix: config.queue.prefix,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: { count: 1_000 },
          removeOnFail: { age: 7 * 24 * 60 * 60 },
        },
      }),
    }),
  ],
})
export class QueueModule {}
