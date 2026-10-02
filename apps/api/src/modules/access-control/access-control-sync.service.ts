import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';

import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { syncAccessControl } from './access-control-sync.js';

/** Syncs the permission catalog and system roles on startup (ACCESS_CONTROL_SYNC_ON_BOOT). */
@Injectable()
export class AccessControlSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AccessControlSyncService.name);

  constructor(
    private readonly system: SystemDatabase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.accessControl.syncOnBoot) return;
    const summary = await syncAccessControl(this.system.client);
    this.logger.log(summary, 'Access control catalog synced');
  }
}
