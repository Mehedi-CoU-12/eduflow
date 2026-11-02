import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { isUuid } from '../../common/utils/uuid.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { assertRowLevelSecurityEnforced } from './database-safety.js';
import { createPrismaClient, type Prisma, type PrismaClient } from './prisma.js';

/** The identity row level security filters by. */
export interface TenantScope {
  readonly schoolId: string;
  readonly userId: string;
}

/** A transaction in which RLS exposes only `schoolId`'s rows. */
export interface TenantTx {
  readonly db: Prisma.TransactionClient;
  readonly schoolId: string;
  readonly userId: string;
}

/** A transaction with only the user identity set (no school selected). */
export interface UserTx {
  readonly db: Prisma.TransactionClient;
  readonly userId: string;
}

export interface TxOptions {
  /** Milliseconds before the transaction is aborted (Prisma default: 5000). */
  readonly timeout?: number;
  readonly isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * The database client for normal requests. It connects as `eduflow_app`, which is
 * subject to row level security, and only exposes queries inside a transaction whose
 * tenant context has been set — there is deliberately no way to run a query without one.
 *
 * Context is set with `set_config(..., true)`, which is scoped to the transaction, so a
 * pooled connection can never carry one request's tenant into another request.
 */
@Injectable()
export class AppDatabase implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = createPrismaClient({
      connectionString: config.database.appUrl,
      poolMax: config.database.poolMax,
      applicationName: 'eduflow-api',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    await assertRowLevelSecurityEnforced(this.client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  /** Runs `fn` in a transaction where RLS sees only the given school, as the given user. */
  withTenant<T>(scope: TenantScope, fn: (tx: TenantTx) => Promise<T>, options?: TxOptions): Promise<T> {
    assertId(scope.schoolId, 'schoolId');
    assertId(scope.userId, 'userId');
    return this.client.$transaction(async (db) => {
      await db.$executeRaw`SELECT set_config('app.school_id', ${scope.schoolId}, true), set_config('app.user_id', ${scope.userId}, true)`;
      return fn({ db, schoolId: scope.schoolId, userId: scope.userId });
    }, options);
  }

  /**
   * Runs `fn` with only the user set. RLS then exposes the user's own profile and their
   * own memberships across schools (for the school picker) — never other users' data.
   */
  withUser<T>(userId: string, fn: (tx: UserTx) => Promise<T>, options?: TxOptions): Promise<T> {
    assertId(userId, 'userId');
    return this.client.$transaction(async (db) => {
      await db.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
      return fn({ db, userId });
    }, options);
  }

  /** Connectivity probe for health checks. Reads no tenant data. */
  async ping(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}

function assertId(value: string, name: string): void {
  if (!isUuid(value)) throw new Error(`Invalid ${name} for database context`);
}
