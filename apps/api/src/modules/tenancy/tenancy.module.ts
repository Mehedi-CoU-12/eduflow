import { Module } from '@nestjs/common';

import { HostResolverService } from './host-resolver.service.js';
import { TenantController } from './tenant.controller.js';
import { TenantResolverService } from './tenant-resolver.service.js';

/** TenantResolver: hostname -> school (HostResolverService), session -> membership (TenantResolverService). */
@Module({
  controllers: [TenantController],
  providers: [HostResolverService, TenantResolverService],
  exports: [HostResolverService, TenantResolverService],
})
export class TenancyModule {}
