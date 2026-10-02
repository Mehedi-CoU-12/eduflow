import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { defineConfig } from 'eslint/config';

import { base } from './base.js';

/** Next.js app config: Next's recommended rules on top of the shared base. */
export const next = defineConfig(base, nextVitals, nextTypescript, {
  rules: {
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
  },
});

export default next;
