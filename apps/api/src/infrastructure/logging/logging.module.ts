import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import type { AppRequest } from '../../common/http/request-context.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';

const REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Structured JSON logs (pretty-printed in development). Each request gets an id that
 * is echoed in the `x-request-id` header, included in error responses and recorded in
 * audit entries. Secrets are redacted.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.logLevel,
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const incoming = req.headers['x-request-id'];
            const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          customProps: (req: IncomingMessage) => {
            const context = (req as Partial<AppRequest>).context;
            return {
              userId: context?.auth?.userId,
              schoolId: context?.tenant?.schoolId,
            };
          },
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
          },
          redact: {
            paths: [
              'req.headers.cookie',
              'req.headers.authorization',
              'res.headers["set-cookie"]',
              '*.password',
              '*.passwordHash',
              '*.token',
            ],
            censor: '[redacted]',
          },
          autoLogging: {
            ignore: (req: IncomingMessage) => req.url?.startsWith('/api/v1/health') ?? false,
          },
          ...(config.env === 'development'
            ? { transport: { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } } }
            : {}),
        },
      }),
    }),
  ],
})
export class LoggingModule {}
