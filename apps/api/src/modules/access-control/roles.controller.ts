import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import {
  createRoleSchema,
  updateRoleSchema,
  uuidSchema,
  type CreateRoleInput,
  type PermissionDto,
  type RoleDto,
  type UpdateRoleInput,
} from '@eduflow/types';

import type { RequestMeta } from '../../common/http/request-context.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { RequirePermissions } from './access-policy.js';
import { CurrentTenant, ReqMeta } from './request-decorators.js';
import { RolesService } from './roles.service.js';

@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  @RequirePermissions('roles.view')
  list(@CurrentTenant() tenant: TenantContext): Promise<RoleDto[]> {
    return this.roles.list(tenant);
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body({ schema: createRoleSchema }) input: CreateRoleInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<RoleDto> {
    return this.roles.create(tenant, input, meta);
  }

  @Put('roles/:roleId')
  @RequirePermissions('roles.manage')
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('roleId', { schema: uuidSchema }) roleId: string,
    @Body({ schema: updateRoleSchema }) input: UpdateRoleInput,
    @ReqMeta() meta: RequestMeta,
  ): Promise<RoleDto> {
    return this.roles.update(tenant, roleId, input, meta);
  }

  @Delete('roles/:roleId')
  @RequirePermissions('roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('roleId', { schema: uuidSchema }) roleId: string,
    @ReqMeta() meta: RequestMeta,
  ): Promise<void> {
    return this.roles.delete(tenant, roleId, meta);
  }

  @Get('permissions')
  @RequirePermissions('roles.view')
  permissions(): PermissionDto[] {
    return this.roles.permissions();
  }
}
