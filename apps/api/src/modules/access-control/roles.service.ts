import { Injectable } from '@nestjs/common';
import {
  PERMISSIONS,
  SCHOOL_PERMISSION_KEYS,
  isSchoolPermissionKey,
  type PermissionDto,
  type RoleDto,
} from '@shikkhacore/types';

import { AppDatabase } from '../../infrastructure/database/app-database.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

@Injectable()
export class RolesService {
  constructor(private readonly db: AppDatabase) {}

  /** System roles plus the school's custom roles, with their grants. */
  list(tenant: TenantContext): Promise<RoleDto[]> {
    return this.db.withTenant(tenant, async (tx) => {
      const roles = await tx.db.role.findMany({
        where: { realm: 'school', OR: [{ schoolId: null }, { schoolId: tx.schoolId }] },
        orderBy: [{ schoolId: { sort: 'asc', nulls: 'first' } }, { name: 'asc' }],
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          schoolId: true,
          grants: { select: { permissionKey: true, scope: true }, orderBy: { permissionKey: 'asc' } },
        },
      });
      return roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.schoolId === null,
        grants: role.grants.flatMap((grant) =>
          isSchoolPermissionKey(grant.permissionKey) ? [{ key: grant.permissionKey, scope: grant.scope }] : [],
        ),
      }));
    });
  }

  /** The school-realm permission catalog, for role editors. */
  permissions(): PermissionDto[] {
    return SCHOOL_PERMISSION_KEYS.map((key) => {
      const definition = PERMISSIONS[key];
      return {
        key,
        realm: definition.realm,
        module: definition.module,
        description: definition.description,
        scopes: [...definition.scopes],
      };
    });
  }
}
