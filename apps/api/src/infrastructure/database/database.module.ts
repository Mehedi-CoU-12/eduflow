import { Global, Module } from '@nestjs/common';

import { AppDatabase } from './app-database.js';
import { SystemDatabase } from './system-database.js';

@Global()
@Module({
  providers: [AppDatabase, SystemDatabase],
  exports: [AppDatabase, SystemDatabase],
})
export class DatabaseModule {}
