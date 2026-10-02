import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';

export { Prisma, PrismaClient } from '../../generated/prisma/client.js';

export interface PrismaClientOptions {
  readonly connectionString: string;
  readonly poolMax: number;
  /** Shows up in pg_stat_activity, which makes the two connection pools easy to tell apart. */
  readonly applicationName: string;
}

export function createPrismaClient(options: PrismaClientOptions): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: options.connectionString,
    max: options.poolMax,
    application_name: options.applicationName,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  return new PrismaClient({ adapter });
}
