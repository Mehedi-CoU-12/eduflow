import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createSchoolSchema, type CreateSchoolInput, type SchoolDto } from '@shikkhacore/types';

import type { RequestMeta } from '../../common/http/request-context.js';
import { Authenticated, RequirePermissions } from '../access-control/access-policy.js';
import { CurrentAuth, CurrentHost, CurrentTenant, ReqMeta } from '../access-control/request-decorators.js';
import type { AuthContext } from '../auth/auth.types.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import type { HostContext } from '../tenancy/tenancy.types.js';
import { SchoolsService } from './schools.service.js';

@Controller()
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  @Post('schools')
  @Authenticated()
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  create(
    @Body({ schema: createSchoolSchema }) input: CreateSchoolInput,
    @CurrentAuth() auth: AuthContext,
    @CurrentHost() host: HostContext,
    @ReqMeta() meta: RequestMeta,
  ): Promise<SchoolDto> {
    return this.schools.create(auth, host, input, meta);
  }

  /** The school resolved for this request. */
  @Get('school')
  @RequirePermissions('school.view')
  current(@CurrentTenant() tenant: TenantContext): Promise<SchoolDto> {
    return this.schools.current(tenant);
  }
}
