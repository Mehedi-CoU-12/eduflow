import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  listAuditLogsQuerySchema,
  listPlatformSchoolsQuerySchema,
  listPlatformUsersQuerySchema,
  updateSchoolStatusSchema,
  uuidSchema,
  type AuditLogDto,
  type ListAuditLogsQuery,
  type ListPlatformSchoolsQuery,
  type ListPlatformUsersQuery,
  type PlatformOverviewDto,
  type PlatformSchoolDto,
  type PlatformUserDto,
  type UpdateSchoolStatusInput,
} from '@eduflow/types';

import type { Page } from '../../common/http/page.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { RequirePlatformPermissions } from '../access-control/access-policy.js';
import { ReqMeta } from '../access-control/request-decorators.js';
import { PlatformService } from './platform.service.js';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('overview')
  @RequirePlatformPermissions('platform.schools.view')
  overview(): Promise<PlatformOverviewDto> {
    return this.platform.overview();
  }

  @Get('schools')
  @RequirePlatformPermissions('platform.schools.view')
  schools(
    @Query({ schema: listPlatformSchoolsQuerySchema }) query: ListPlatformSchoolsQuery,
  ): Promise<Page<PlatformSchoolDto>> {
    return this.platform.listSchools(query);
  }

  @Patch('schools/:schoolId/status')
  @RequirePlatformPermissions('platform.schools.manage')
  updateSchoolStatus(
    @Param('schoolId', { schema: uuidSchema }) schoolId: string,
    @Body({ schema: updateSchoolStatusSchema }) input: UpdateSchoolStatusInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<PlatformSchoolDto> {
    return this.platform.updateSchoolStatus(schoolId, input, meta);
  }

  @Get('users')
  @RequirePlatformPermissions('platform.users.view')
  users(
    @Query({ schema: listPlatformUsersQuerySchema }) query: ListPlatformUsersQuery,
  ): Promise<Page<PlatformUserDto>> {
    return this.platform.listUsers(query);
  }

  @Get('audit')
  @RequirePlatformPermissions('platform.audit.view')
  audit(
    @Query({ schema: listAuditLogsQuerySchema }) query: ListAuditLogsQuery,
  ): Promise<Page<AuditLogDto>> {
    return this.platform.listAuditLogs(query);
  }
}
