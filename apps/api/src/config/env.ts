import type { HostConfig } from '@eduflow/types';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((value) => value === 'true');

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    DATABASE_URL: z.url(),
    SYSTEM_DATABASE_URL: z.url(),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(200).default(10),

    REDIS_URL: z.url(),
    QUEUE_PREFIX: z
      .string()
      .regex(/^[A-Za-z0-9:_-]+$/)
      .default('eduflow'),
    WORKER_ENABLED: bool.default(true),

    APP_PUBLIC_URL: z.url(),
    APP_BASE_DOMAIN: z.string().trim().toLowerCase().min(1),
    APP_ROOT_HOSTS: csv,
    APP_PLATFORM_HOSTS: csv,
    TRUST_PROXY: z.string().default('loopback'),
    CORS_ORIGINS: csv,

    SESSION_COOKIE_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .default('sc_session'),
    COOKIE_SECURE: bool.default(false),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    SESSION_IDLE_TIMEOUT_HOURS: z.coerce.number().int().min(1).max(2160).default(168),

    RATE_LIMIT_ENABLED: bool.default(true),
    LOGIN_MAX_FAILURES: z.coerce.number().int().min(1).max(100).default(10),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),

    MAIL_TRANSPORT: z.enum(['smtp', 'log', 'memory']).default('log'),
    SMTP_URL: z.string().optional(),
    MAIL_FROM: z.string().min(3).default('EduFlow <no-reply@eduflow.local>'),

    ACCESS_CONTROL_SYNC_ON_BOOT: bool.default(true),
  })
  .superRefine((env, ctx) => {
    if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_URL) {
      ctx.addIssue({ code: 'custom', path: ['SMTP_URL'], message: 'required when MAIL_TRANSPORT=smtp' });
    }
    if (env.APP_ROOT_HOSTS.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['APP_ROOT_HOSTS'], message: 'at least one root host is required' });
    }
    if (env.NODE_ENV === 'production') {
      if (!env.COOKIE_SECURE) {
        ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'must be true in production' });
      }
      if (!env.SESSION_COOKIE_NAME.startsWith('__Host-')) {
        ctx.addIssue({
          code: 'custom',
          path: ['SESSION_COOKIE_NAME'],
          message: 'must use the __Host- prefix in production',
        });
      }
      if (env.MAIL_TRANSPORT === 'memory') {
        ctx.addIssue({ code: 'custom', path: ['MAIL_TRANSPORT'], message: 'memory transport is for tests only' });
      }
    }
  });

export type Environment = z.infer<typeof envSchema>['NODE_ENV'];

export interface AppConfig {
  readonly env: Environment;
  readonly port: number;
  readonly logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  readonly database: { readonly appUrl: string; readonly systemUrl: string; readonly poolMax: number };
  readonly redis: { readonly url: string };
  readonly queue: { readonly prefix: string; readonly workerEnabled: boolean };
  readonly hosts: HostConfig & { readonly publicUrl: string };
  readonly http: { readonly trustProxy: boolean | number | string; readonly corsOrigins: readonly string[] };
  readonly session: {
    readonly cookieName: string;
    readonly secure: boolean;
    readonly ttlMs: number;
    readonly idleTimeoutMs: number;
  };
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly loginMaxFailures: number;
    readonly loginLockoutMs: number;
  };
  readonly mail: {
    readonly transport: 'smtp' | 'log' | 'memory';
    readonly smtpUrl: string | undefined;
    readonly from: string;
  };
  readonly accessControl: { readonly syncOnBoot: boolean };
}

function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

/** Validates the environment and returns the typed configuration. Throws on invalid input. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  const env = result.data;
  return {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: { appUrl: env.DATABASE_URL, systemUrl: env.SYSTEM_DATABASE_URL, poolMax: env.DATABASE_POOL_MAX },
    redis: { url: env.REDIS_URL },
    queue: { prefix: env.QUEUE_PREFIX, workerEnabled: env.WORKER_ENABLED },
    hosts: {
      publicUrl: env.APP_PUBLIC_URL,
      baseDomain: env.APP_BASE_DOMAIN,
      rootHosts: env.APP_ROOT_HOSTS,
      platformHosts: env.APP_PLATFORM_HOSTS,
    },
    http: { trustProxy: parseTrustProxy(env.TRUST_PROXY), corsOrigins: env.CORS_ORIGINS },
    session: {
      cookieName: env.SESSION_COOKIE_NAME,
      secure: env.COOKIE_SECURE,
      ttlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
      idleTimeoutMs: env.SESSION_IDLE_TIMEOUT_HOURS * 60 * 60 * 1000,
    },
    rateLimit: {
      enabled: env.RATE_LIMIT_ENABLED,
      loginMaxFailures: env.LOGIN_MAX_FAILURES,
      loginLockoutMs: env.LOGIN_LOCKOUT_MINUTES * 60 * 1000,
    },
    mail: { transport: env.MAIL_TRANSPORT, smtpUrl: env.SMTP_URL, from: env.MAIL_FROM },
    accessControl: { syncOnBoot: env.ACCESS_CONTROL_SYNC_ON_BOOT },
  };
}

/** Loads `.env` from the working directory when present. Real environment variables win. */
export function loadDotEnv(path = '.env'): void {
  try {
    process.loadEnvFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
