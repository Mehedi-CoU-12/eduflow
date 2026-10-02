import { existsSync } from 'node:fs';

import { defineConfig, env } from 'prisma/config';

// Prisma 7 no longer loads .env files itself.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations run as the schema owner. The API itself never receives this URL.
    url: env('MIGRATION_DATABASE_URL'),
  },
});
