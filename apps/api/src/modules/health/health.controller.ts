import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import type { HealthDto } from '@eduflow/types';
import type { Response } from 'express';
import type { Redis } from 'ioredis';

import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { REDIS } from '../../infrastructure/redis/redis.module.js';
import { Public } from '../access-control/access-policy.js';

async function probe(check: () => Promise<unknown>): Promise<'up' | 'down'> {
  try {
    await check();
    return 'up';
  } catch {
    return 'down';
  }
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly app: AppDatabase,
    private readonly system: SystemDatabase,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /** Liveness: the process is up. Never touches dependencies. */
  @Get('live')
  @Public({ anyHost: true })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness: dependencies reachable. Responds 503 when any check fails. */
  @Get()
  @Public({ anyHost: true })
  async ready(@Res({ passthrough: true }) res: Response): Promise<HealthDto> {
    const [database, systemDatabase, redis] = await Promise.all([
      probe(() => this.app.ping()),
      probe(() => this.system.ping()),
      probe(() => this.redis.ping()),
    ]);
    const checks = { database, systemDatabase, redis };
    const healthy = Object.values(checks).every((status) => status === 'up');
    if (!healthy) res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { status: healthy ? 'ok' : 'degraded', checks };
  }
}
