import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  listMembersQuerySchema,
  updateMemberRolesSchema,
  uuidSchema,
  type ListMembersQuery,
  type MemberDto,
  type UpdateMemberRolesInput,
} from '@shikkhacore/types';

import type { Page } from '../../common/http/page.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { RequirePermissions } from '../access-control/access-policy.js';
import { CurrentTenant, ReqMeta } from '../access-control/request-decorators.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { MembersService } from './members.service.js';

/** Members of the school resolved for this request. */
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @RequirePermissions('users.view')
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query({ schema: listMembersQuerySchema }) query: ListMembersQuery,
  ): Promise<Page<MemberDto>> {
    return this.members.list(tenant, query);
  }

  @Get(':membershipId')
  @RequirePermissions('users.view')
  get(
    @CurrentTenant() tenant: TenantContext,
    @Param('membershipId', { schema: uuidSchema }) membershipId: string,
  ): Promise<MemberDto> {
    return this.members.get(tenant, membershipId);
  }

  @Put(':membershipId/roles')
  @RequirePermissions('roles.assign')
  updateRoles(
    @CurrentTenant() tenant: TenantContext,
    @Param('membershipId', { schema: uuidSchema }) membershipId: string,
    @Body({ schema: updateMemberRolesSchema }) input: UpdateMemberRolesInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<MemberDto> {
    return this.members.updateRoles(tenant, membershipId, input, meta);
  }
}
