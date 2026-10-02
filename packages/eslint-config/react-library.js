import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { base } from './base.js';

/** Config for React component packages (packages/ui). */
export const reactLibrary = defineConfig(base, reactHooks.configs.flat['recommended-latest'], {
  languageOptions: {
    globals: { ...globals.browser },
  },
  rules: {
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
  },
});

export default reactLibrary;
