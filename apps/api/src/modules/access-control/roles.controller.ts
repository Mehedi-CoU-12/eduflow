import { Controller, Get } from '@nestjs/common';
import type { PermissionDto, RoleDto } from '@shikkhacore/types';

import type { TenantContext } from '../tenancy/tenant-context.js';
import { RequirePermissions } from './access-policy.js';
import { CurrentTenant } from './request-decorators.js';
import { RolesService } from './roles.service.js';

@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  @RequirePermissions('roles.view')
  list(@CurrentTenant() tenant: TenantContext): Promise<RoleDto[]> {
    return this.roles.list(tenant);
  }

  @Get('permissions')
  @RequirePermissions('roles.view')
  permissions(): PermissionDto[] {
    return this.roles.permissions();
  }
}
