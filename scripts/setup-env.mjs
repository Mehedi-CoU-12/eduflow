#!/usr/bin/env node
import { existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const filesToCopy = [
  {
    from: resolve(rootDir, '.env.example'),
    to: resolve(rootDir, '.env'),
    name: 'Root infrastructure .env',
  },
  {
    from: resolve(rootDir, 'apps/api/.env.example'),
    to: resolve(rootDir, 'apps/api/.env'),
    name: 'API application .env',
  },
  {
    from: resolve(rootDir, 'apps/web/.env.example'),
    to: resolve(rootDir, 'apps/web/.env.local'),
    name: 'Web application .env.local',
    optional: true,
  },
];

console.log('🚀 Setting up environment configuration files...\n');

let createdCount = 0;

for (const { from, to, name, optional } of filesToCopy) {
  if (!existsSync(from)) {
    if (optional) continue;
    console.warn(`⚠️  Source template not found: ${from}`);
    continue;
  }

  if (existsSync(to)) {
    console.log(`ℹ️  ${name} already exists at ${to}`);
  } else {
    copyFileSync(from, to);
    console.log(`✅ Created ${name} at ${to}`);
    createdCount++;
  }
}

console.log(`\n✨ Environment setup complete! (${createdCount} file(s) created)`);
console.log('\nNext steps:');
console.log('  1. Review connection secrets in .env and apps/api/.env');
console.log('  2. Start infrastructure:  pnpm infra:up');
console.log('  3. Apply database migration: pnpm db:migrate');
console.log('  4. Seed database:          pnpm db:seed');
console.log('  5. Start development:      pnpm dev\n');
