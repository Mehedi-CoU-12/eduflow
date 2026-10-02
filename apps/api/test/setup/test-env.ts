import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

export const TEST_DATABASE = 'shikkhacore_test';
const TEST_REDIS_DB = 15;

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function withRedisDb(url: string, db: number): string {
  const parsed = new URL(url);
  parsed.pathname = `/${db}`;
  return parsed.toString();
}

/**
 * Real environment variables (CI) win over apps/api/.env. The file is parsed directly
 * because inside Jest's sandbox process.loadEnvFile() would not update process.env.
 */
function sourceEnv(): Record<string, string | undefined> {
  const fromFile = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
  return { ...fromFile, ...process.env };
}

/**
 * Environment for integration tests: connection details come from apps/api/.env (or
 * the real environment, e.g. in CI) but every store is redirected to test-only
 * resources — the `shikkhacore_test` database and Redis database 15 — so tests can
 * never touch development data. Override with TEST_DATABASE_URL etc. if needed.
 */
export function buildTestEnv(): Record<string, string> {
  const source = sourceEnv();
  const required = (key: string): string => {
    const value = source[key];
    if (!value) throw new Error(`${key} must be set (copy apps/api/.env.example to apps/api/.env)`);
    return value;
  };
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: source.TEST_DATABASE_URL ?? withDatabase(required('DATABASE_URL'), TEST_DATABASE),
    SYSTEM_DATABASE_URL:
      source.TEST_SYSTEM_DATABASE_URL ?? withDatabase(required('SYSTEM_DATABASE_URL'), TEST_DATABASE),
    MIGRATION_DATABASE_URL:
      source.TEST_MIGRATION_DATABASE_URL ?? withDatabase(required('MIGRATION_DATABASE_URL'), TEST_DATABASE),
    DATABASE_POOL_MAX: '5',
    REDIS_URL: source.TEST_REDIS_URL ?? withRedisDb(required('REDIS_URL'), TEST_REDIS_DB),
    QUEUE_PREFIX: `test-${randomBytes(4).toString('hex')}`,
    WORKER_ENABLED: 'true',
    APP_PUBLIC_URL: 'http://localhost:3100',
    APP_BASE_DOMAIN: 'localhost',
    APP_ROOT_HOSTS: 'localhost',
    APP_PLATFORM_HOSTS: 'admin.localhost',
    TRUST_PROXY: 'loopback',
    CORS_ORIGINS: '',
    SESSION_COOKIE_NAME: 'sc_session',
    COOKIE_SECURE: 'false',
    RATE_LIMIT_ENABLED: 'false',
    LOGIN_MAX_FAILURES: '10',
    LOGIN_LOCKOUT_MINUTES: '15',
    MAIL_TRANSPORT: 'memory',
    MAIL_FROM: 'ShikkhaCore Test <test@shikkhacore.local>',
    ACCESS_CONTROL_SYNC_ON_BOOT: 'true',
  };
}
