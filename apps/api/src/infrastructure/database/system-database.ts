import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { assertSystemRoleIsNotOwner } from './database-safety.js';
import { createPrismaClient, type PrismaClient } from './prisma.js';

/**
 * Cross-tenant database access for a few trusted code paths only:
 *
 *   - authentication (credentials, sessions and tokens are not tenant data)
 *   - resolving a hostname to a school before anyone is signed in
 *   - platform administration
 *   - syncing the permission catalog, seeding and auditing user-level events
 *
 * It connects as `eduflow_system`, which RLS lets through via explicit
 * `system_access` policies. ESLint (no-restricted-imports in apps/api/eslint.config.js)
 * blocks importing this class anywhere else. Ordinary school features must use
 * AppDatabase.withTenant().
 */
@Injectable()
export class SystemDatabase implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = createPrismaClient({
      connectionString: config.database.systemUrl,
      poolMax: Math.max(2, Math.ceil(config.database.poolMax / 2)),
      applicationName: 'eduflow-api-system',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    await assertSystemRoleIsNotOwner(this.client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  async ping(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}
