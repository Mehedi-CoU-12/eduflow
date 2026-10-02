import { VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import type { AppConfig } from './config/env.js';

/** HTTP-level configuration shared by main.ts and the API tests. */
export function configureApp(app: NestExpressApplication, config: AppConfig): void {
  // Behind the web app / load balancer: trust X-Forwarded-* only from these proxies.
  app.set('trust proxy', config.http.trustProxy);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // The API only serves JSON; nothing may be framed or executed from it.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      strictTransportSecurity:
        config.env === 'production' ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    }),
  );
  app.use(cookieParser());

  // Routes are served at /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Same-origin by design (the API lives under /api on each school's host). CORS is only
  // for additional first-party clients listed in CORS_ORIGINS.
  if (config.http.corsOrigins.length > 0) {
    app.enableCors({ origin: [...config.http.corsOrigins], credentials: true });
  }

  app.enableShutdownHooks();
}
