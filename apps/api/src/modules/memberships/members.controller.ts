import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  inviteMemberSchema,
  listMembersQuerySchema,
  updateMemberRolesSchema,
  updateMemberStatusSchema,
  uuidSchema,
  type InviteMemberInput,
  type ListMembersQuery,
  type MemberDto,
  type UpdateMemberRolesInput,
  type UpdateMemberStatusInput,
} from '@eduflow/types';

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

  @Post('invite')
  @RequirePermissions('users.invite')
  invite(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: inviteMemberSchema }) input: InviteMemberInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<MemberDto> {
    return this.members.invite(tenant, input, meta);
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

  @Patch(':membershipId/status')
  @RequirePermissions('users.update')
  updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('membershipId', { schema: uuidSchema }) membershipId: string,
    @Body({ schema: updateMemberStatusSchema }) input: UpdateMemberStatusInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<MemberDto> {
    return this.members.updateStatus(tenant, membershipId, input, meta);
  }

  @Delete(':membershipId')
  @RequirePermissions('users.remove')
  remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('membershipId', { schema: uuidSchema }) membershipId: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<MemberDto> {
    return this.members.remove(tenant, membershipId, meta);
  }
}
