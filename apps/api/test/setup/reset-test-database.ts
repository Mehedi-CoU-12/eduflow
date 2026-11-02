import { execFileSync } from 'node:child_process';

import { Redis } from 'ioredis';
import pg from 'pg';

import { buildTestEnv } from './test-env.js';

/**
 * Recreates the test database from scratch, applies every migration exactly as
 * production would (`prisma migrate deploy`) and empties the test Redis database.
 * Runs before the integration suites (see global-setup.js) or via `pnpm test:db:reset`.
 */
async function resetTestDatabase(): Promise<void> {
  const env = buildTestEnv();
  const migrationUrl = new URL(env.MIGRATION_DATABASE_URL!);
  const database = migrationUrl.pathname.slice(1);
  if (!database.endsWith('_test')) {
    throw new Error(`Refusing to reset "${database}": test databases must end with _test`);
  }

  const maintenanceUrl = new URL(migrationUrl);
  maintenanceUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: maintenanceUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
    await admin.query(`CREATE DATABASE "${database}" OWNER eduflow_owner`);
    await admin.query(`REVOKE ALL ON DATABASE "${database}" FROM PUBLIC`);
    await admin.query(`GRANT CONNECT ON DATABASE "${database}" TO eduflow_app, eduflow_system`);
  } finally {
    await admin.end();
  }

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, ...env, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'pipe',
  });

  const redis = new Redis(env.REDIS_URL!);
  try {
    await redis.flushdb();
  } finally {
    await redis.quit();
  }
}

await resetTestDatabase();
