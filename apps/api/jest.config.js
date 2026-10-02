/**
 * Unit tests: colocated `*.spec.ts` files. No database or Redis required.
 * Jest runs in native ESM mode (NODE_OPTIONS=--experimental-vm-modules, see package.json),
 * so module mocking uses `jest.unstable_mockModule`; prefer Nest DI overrides instead.
 * @type {import('jest').Config}
 */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', useESM: true }],
  },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
