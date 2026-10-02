import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { base } from './base.js';

/** NestJS API config. */
export const nest = defineConfig(
  base,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Nest modules are intentionally empty decorated classes.
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.jest },
    },
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);

export default nest;
