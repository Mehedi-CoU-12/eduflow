/**
 * Integration and API tests against real PostgreSQL and Redis (`pnpm infra:up`).
 * The global setup recreates the `shikkhacore_test` database and applies all migrations.
 * Suites run serially because they share that database.
 * @type {import('jest').Config}
 */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.e2e-spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', useESM: true }],
  },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  globalSetup: '<rootDir>/test/setup/global-setup.js',
  setupFiles: ['<rootDir>/test/setup/env.ts'],
  maxWorkers: 1,
  testTimeout: 30_000,
};
