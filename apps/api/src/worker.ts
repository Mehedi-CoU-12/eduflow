import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { loadConfig, loadDotEnv } from './config/env.js';

/**
 * Background worker: same module graph, no HTTP server, BullMQ processors enabled.
 * In production run the API with WORKER_ENABLED=false and scale this process separately.
 */
loadDotEnv();
const config = loadConfig({ ...process.env, WORKER_ENABLED: 'true' });

const app = await NestFactory.createApplicationContext(AppModule.forRoot(config), { bufferLogs: true });
app.useLogger(app.get(Logger));
app.enableShutdownHooks();
app.get(Logger).log('EduFlow worker started', 'Bootstrap');
