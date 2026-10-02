import 'reflect-metadata';
// @nestjs/throttler is CommonJS and require()s the ESM @nestjs/common. Evaluating the
// ESM Nest packages up front stops Jest's ESM loader from seeing that as a require cycle.
import '@nestjs/common';
import '@nestjs/core';

import { buildTestEnv } from './test-env.js';

// Runs before each test file: point everything at the test database and test Redis.
Object.assign(process.env, buildTestEnv());
