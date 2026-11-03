import type { Server } from 'node:http';

import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { loadConfig, type AppConfig } from '../../src/config/env.js';
import { SystemDatabase } from '../../src/infrastructure/database/system-database.js';
import { MAIL_TRANSPORT, MemoryMailTransport } from '../../src/infrastructure/mail/mail-transport.js';

export interface TestApp {
  readonly app: NestExpressApplication;
  readonly http: Server;
  readonly config: AppConfig;
  readonly db: SystemDatabase['client'];
  readonly mail: MemoryMailTransport;
  close(): Promise<void>;
}

/** Boots the real application (same module graph and HTTP setup as main.ts) against the test stores. */
export async function createTestApp(overrides: Record<string, string> = {}): Promise<TestApp> {
  const config = loadConfig({ ...process.env, ...overrides });
  const moduleRef = await Test.createTestingModule({ imports: [AppModule.forRoot(config)] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app, config);
  await app.init();

  const mail = app.get(MAIL_TRANSPORT);
  if (!(mail instanceof MemoryMailTransport)) throw new Error('Tests require MAIL_TRANSPORT=memory');

  return {
    app,
    http: app.getHttpServer(),
    config,
    db: app.get(SystemDatabase).client,
    mail,
    close: () => app.close(),
  };
}
