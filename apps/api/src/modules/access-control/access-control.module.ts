import { Module } from '@nestjs/common';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AccessControlSyncService } from './access-control-sync.service.js';
import { AccessGuard } from './access.guard.js';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';
import { RoutePolicyCheck } from './route-policy.check.js';

@Module({
  imports: [DiscoveryModule, AuthModule, TenancyModule, PlatformModule],
  controllers: [RolesController],
  providers: [
    { provide: APP_GUARD, useClass: AccessGuard },
    AccessControlSyncService,
    RolesService,
    RoutePolicyCheck,
  ],
})
export class AccessControlModule {}
