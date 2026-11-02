import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadConfig, loadDotEnv } from './config/env.js';

loadDotEnv();
const config = loadConfig();

const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config), { bufferLogs: true });
app.useLogger(app.get(Logger));
configureApp(app, config);

await app.listen(config.port);
app.get(Logger).log(`EduFlow API listening on http://localhost:${config.port}/api/v1`, 'Bootstrap');
