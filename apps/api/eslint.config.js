import { nest } from '@shikkhacore/eslint-config/nest';
import { defineConfig } from 'eslint/config';

export default defineConfig(nest, {
  // The system database client can read across tenants. Only the narrow, reviewed
  // code paths listed in `ignores` may import it; everything else must go through
  // AppDatabase, which enforces row level security.
  files: ['src/**/*.ts'],
  ignores: [
    'src/infrastructure/database/**',
    'src/modules/access-control/access-control-sync.service.ts',
    'src/modules/audit/**',
    'src/modules/auth/**',
    'src/modules/health/**',
    'src/modules/platform/**',
    'src/modules/tenancy/host-resolver.service.ts',
  ],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/system-database.js'],
            message:
              'SystemDatabase bypasses tenant isolation. Use AppDatabase.withTenant(); see docs/multi-tenancy.md.',
          },
        ],
      },
    ],
  },
});
