import { Injectable } from '@nestjs/common';
import {
  isSchoolPermissionKey,
  type ListMembersQuery,
  type MemberDto,
  type SchoolPermissionKey,
  type UpdateMemberRolesInput,
} from '@shikkhacore/types';

import { AppError } from '../../common/errors/app-error.js';
import { encodeCursor } from '../../common/http/cursor.js';
import { Page } from '../../common/http/page.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { PermissionSet, type Grant } from '../access-control/permission-set.js';
import { AuditService } from '../audit/audit.service.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { MembersRepository, type MemberRow } from './members.repository.js';

@Injectable()
export class MembersService {
  constructor(
    private readonly db: AppDatabase,
    private readonly members: MembersRepository,
    private readonly audit: AuditService,
  ) {}

  list(tenant: TenantContext, query: ListMembersQuery): Promise<Page<MemberDto>> {
    return this.db.withTenant(tenant, async (tx) => {
      const rows = await this.members.list(tx, query);
      return Page.fromOverfetch(rows, query.limit, toMemberDto, (row) =>
        encodeCursor({ name: row.user.name, id: row.id }),
      );
    });
  }

  get(tenant: TenantContext, membershipId: string): Promise<MemberDto> {
    return this.db.withTenant(tenant, async (tx) => {
      const row = await this.members.findById(tx, membershipId);
      if (!row) throw memberNotFound();
      return toMemberDto(row);
    });
  }

  /**
   * Replaces a member's roles. Guards against privilege escalation: the actor may only
   * grant or take away roles whose permissions they hold themselves (at the same scope
   * or broader), and the school always keeps at least one active School Owner.
   */
  updateRoles(
    tenant: TenantContext,
    membershipId: string,
    input: UpdateMemberRolesInput,
    meta: RequestMeta,
  ): Promise<MemberDto> {
    return this.db.withTenant(tenant, async (tx) => {
      await this.members.lockRoleChanges(tx);

      const member = await this.members.findById(tx, membershipId);
      if (!member) throw memberNotFound();

      const currentIds = member.roles.map(({ role }) => role.id);
      const touchedIds = symmetricDifference(currentIds, input.roleIds);
      const roles = await this.members.findAssignableRoles(tx, [...new Set([...input.roleIds, ...currentIds])]);
      const byId = new Map(roles.map((role) => [role.id, role]));
      if (input.roleIds.some((id) => !byId.has(id))) {
        throw AppError.notFound('ROLE_NOT_FOUND', 'One or more roles do not exist in this school');
      }

      const touchedGrants = PermissionSet.fromGrants(
        touchedIds.flatMap((id) => schoolGrants(byId.get(id)?.grants ?? [])),
      );
      if (!tenant.permissions.covers(touchedGrants)) {
        throw AppError.forbidden(
          'ROLE_ASSIGNMENT_FORBIDDEN',
          'You can only assign or remove roles whose permissions you hold yourself',
        );
      }

      const ownerRoleId = roles.find((role) => role.key === 'school_owner')?.id;
      const losesOwner = ownerRoleId !== undefined && currentIds.includes(ownerRoleId) && !input.roleIds.includes(ownerRoleId);
      if (losesOwner && member.status === 'active' && (await this.members.countActiveOwners(tx)) <= 1) {
        throw AppError.conflict('LAST_OWNER_REQUIRED', 'A school must keep at least one School Owner');
      }

      if (touchedIds.length === 0) return toMemberDto(member);

      await this.members.replaceRoles(tx, membershipId, input.roleIds);
      const updated = await this.members.findById(tx, membershipId);
      if (!updated) throw memberNotFound();

      await this.audit.record(
        tx,
        {
          action: 'membership.roles_updated',
          entityType: 'school_membership',
          entityId: membershipId,
          before: { roles: member.roles.map(({ role }) => ({ id: role.id, key: role.key, name: role.name })) },
          after: { roles: updated.roles.map(({ role }) => ({ id: role.id, key: role.key, name: role.name })) },
          metadata: { userId: member.user.id },
        },
        meta,
      );
      return toMemberDto(updated);
    });
  }
}

function toMemberDto(row: MemberRow): MemberDto {
  return {
    id: row.id,
    status: row.status,
    user: row.user,
    roles: row.roles.map(({ role }) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      isSystem: role.schoolId === null,
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

function schoolGrants(grants: { permissionKey: string; scope: Grant['scope'] }[]): Grant<SchoolPermissionKey>[] {
  return grants.flatMap((grant) =>
    isSchoolPermissionKey(grant.permissionKey) ? [{ key: grant.permissionKey, scope: grant.scope }] : [],
  );
}

function symmetricDifference(a: readonly string[], b: readonly string[]): string[] {
  return [...a.filter((id) => !b.includes(id)), ...b.filter((id) => !a.includes(id))];
}

function memberNotFound(): AppError {
  return AppError.notFound('MEMBER_NOT_FOUND', 'Member not found');
}
