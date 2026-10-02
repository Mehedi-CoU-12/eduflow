import { execFileSync } from 'node:child_process';

/**
 * Jest loads globalSetup outside its own module system, so the TypeScript reset script
 * runs through tsx instead.
 */
export default function globalSetup() {
  execFileSync('pnpm', ['exec', 'tsx', 'test/setup/reset-test-database.ts'], { stdio: 'inherit' });
}
