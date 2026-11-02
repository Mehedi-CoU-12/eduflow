import { Controller, Get, Query } from '@nestjs/common';
import { listAuditLogsQuerySchema, type AuditLogDto, type ListAuditLogsQuery } from '@eduflow/types';

import type { Page } from '../../common/http/page.js';
import { RequirePermissions } from '../access-control/access-policy.js';
import { CurrentTenant } from '../access-control/request-decorators.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { AuditService } from './audit.service.js';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermissions('audit.view')
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listAuditLogsQuerySchema }) query: ListAuditLogsQuery,
  ): Promise<Page<AuditLogDto>> {
    return this.audit.list(tenant, query);
  }
}
