import { Injectable } from '@nestjs/common';
import {
  PERMISSIONS,
  SCHOOL_PERMISSION_KEYS,
  isSchoolPermissionKey,
  type CreateRoleInput,
  type PermissionDto,
  type RoleDto,
  type UpdateRoleInput,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { isUniqueViolation } from '../../infrastructure/database/prisma-errors.js';
import { AuditService } from '../audit/audit.service.js';
import type { TenantContext } from '../tenancy/tenant-context.js';

@Injectable()
export class RolesService {
  constructor(
    private readonly db: AppDatabase,
    private readonly audit: AuditService,
  ) {}

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

  /** Creates a custom role for the current school. */
  async create(tenant: TenantContext, input: CreateRoleInput, meta: RequestMeta): Promise<RoleDto> {
    return this.db.withTenant(tenant, async (tx) => {
      let role;
      try {
        role = await tx.db.role.create({
          data: {
            schoolId: tx.schoolId,
            realm: 'school',
            name: input.name,
            description: input.description ?? null,
            grants: {
              create: input.grants.map((grant) => ({
                permissionKey: grant.key,
                scope: grant.scope,
              })),
            },
          },
          select: {
            id: true,
            key: true,
            name: true,
            description: true,
            schoolId: true,
            grants: { select: { permissionKey: true, scope: true }, orderBy: { permissionKey: 'asc' } },
          },
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw AppError.conflict('ROLE_EXISTS', 'A role with this name already exists in this school');
        }
        throw error;
      }

      await this.audit.record(
        tx,
        { action: 'role.created', entityType: 'role', entityId: role.id, after: role },
        meta,
      );

      return {
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: false,
        grants: role.grants.flatMap((grant) =>
          isSchoolPermissionKey(grant.permissionKey) ? [{ key: grant.permissionKey, scope: grant.scope }] : [],
        ),
      };
    });
  }

  /** Updates an existing custom role for the current school. */
  async update(tenant: TenantContext, roleId: string, input: UpdateRoleInput, meta: RequestMeta): Promise<RoleDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.role.findFirst({
        where: { id: roleId, schoolId: tx.schoolId },
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          grants: { select: { permissionKey: true, scope: true } },
        },
      });
      if (!existing) {
        throw AppError.notFound('ROLE_NOT_FOUND', 'Custom role not found in this school');
      }

      if (input.grants) {
        await tx.db.rolePermission.deleteMany({ where: { roleId } });
        await tx.db.rolePermission.createMany({
          data: input.grants.map((g) => ({ roleId, permissionKey: g.key, scope: g.scope })),
        });
      }

      const updated = await tx.db.role.update({
        where: { id: roleId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          schoolId: true,
          grants: { select: { permissionKey: true, scope: true }, orderBy: { permissionKey: 'asc' } },
        },
      });

      await this.audit.record(
        tx,
        { action: 'role.updated', entityType: 'role', entityId: roleId, before: existing, after: updated },
        meta,
      );

      return {
        id: updated.id,
        key: updated.key,
        name: updated.name,
        description: updated.description,
        isSystem: false,
        grants: updated.grants.flatMap((grant) =>
          isSchoolPermissionKey(grant.permissionKey) ? [{ key: grant.permissionKey, scope: grant.scope }] : [],
        ),
      };
    });
  }

  /** Deletes a custom role if no members hold it. */
  async delete(tenant: TenantContext, roleId: string, meta: RequestMeta): Promise<void> {
    await this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.role.findFirst({
        where: { id: roleId, schoolId: tx.schoolId },
        select: { id: true, name: true, _count: { select: { membershipRoles: true } } },
      });
      if (!existing) {
        throw AppError.notFound('ROLE_NOT_FOUND', 'Custom role not found in this school');
      }
      if (existing._count.membershipRoles > 0) {
        throw AppError.conflict('ROLE_IN_USE', 'Cannot delete a role that is currently assigned to members');
      }

      await tx.db.rolePermission.deleteMany({ where: { roleId } });
      await tx.db.role.delete({ where: { id: roleId } });

      await this.audit.record(
        tx,
        { action: 'role.deleted', entityType: 'role', entityId: roleId, before: { name: existing.name } },
        meta,
      );
    });
  }
}
