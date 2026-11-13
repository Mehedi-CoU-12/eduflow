import { Inject, Injectable } from '@nestjs/common';
import {
  isSchoolPermissionKey,
  type InviteMemberInput,
  type ListMembersQuery,
  type MemberDto,
  type SchoolPermissionKey,
  type UpdateMemberRolesInput,
  type UpdateMemberStatusInput,
} from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import { encodeCursor } from '../../common/http/cursor.js';
import { Page } from '../../common/http/page.js';
import type { RequestMeta } from '../../common/http/request-context.js';
import { APP_CONFIG } from '../../config/config.module.js';
import type { AppConfig } from '../../config/env.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { MailService } from '../../infrastructure/mail/mail.service.js';
import { PermissionSet, type Grant } from '../access-control/permission-set.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthTokenService } from '../auth/auth-token.service.js';
import { UserProvisioningService } from '../auth/user-provisioning.service.js';
import { schoolUrl } from '../tenancy/school-urls.js';
import type { TenantContext } from '../tenancy/tenant-context.js';
import { MEMBER_SELECT, MembersRepository, type MemberRow } from './members.repository.js';

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class MembersService {
  constructor(
    private readonly db: AppDatabase,
    private readonly userProvisioning: UserProvisioningService,
    private readonly mail: MailService,
    private readonly members: MembersRepository,
    private readonly audit: AuditService,
    private readonly tokens: AuthTokenService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
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

  /** Invites a new or existing user to the school with the given roles. */
  async invite(tenant: TenantContext, input: InviteMemberInput, meta: RequestMeta): Promise<MemberDto> {
    const roles = await this.db.withTenant(tenant, (tx) =>
      this.members.findAssignableRoles(tx, input.roleIds),
    );
    const byId = new Map(roles.map((r) => [r.id, r]));
    if (input.roleIds.some((id) => !byId.has(id))) {
      throw AppError.notFound('ROLE_NOT_FOUND', 'One or more roles do not exist in this school');
    }

    const assignedGrants = PermissionSet.fromGrants(
      input.roleIds.flatMap((id) => schoolGrants(byId.get(id)?.grants ?? [])),
    );
    if (!tenant.permissions.covers(assignedGrants)) {
      throw AppError.forbidden('ROLE_ASSIGNMENT_FORBIDDEN', 'You can only assign roles whose permissions you hold yourself');
    }

    // Find or create global user record via auth identity provisioning
    const user = await this.userProvisioning.findOrCreateForInvite({
      email: input.email,
      name: input.name,
    });

    const member = await this.db.withTenant(tenant, async (tx) => {
      const existing = await tx.db.schoolMembership.findUnique({
        where: { schoolId_userId: { schoolId: tx.schoolId, userId: user.id } },
        select: { id: true, status: true },
      });
      if (existing && existing.status !== 'removed') {
        throw AppError.conflict('MEMBER_EXISTS', 'This user is already a member of the school');
      }

      let created: { id: string };
      if (existing) {
        created = await tx.db.schoolMembership.update({
          where: { id: existing.id },
          data: { status: 'invited' },
          select: { id: true },
        });
        await this.members.replaceRoles(tx, existing.id, input.roleIds);
      } else {
        created = await tx.db.schoolMembership.create({
          data: { schoolId: tx.schoolId, userId: user.id, status: 'invited' },
          select: { id: true },
        });
        await tx.db.membershipRole.createMany({
          data: input.roleIds.map((roleId) => ({ membershipId: created.id, roleId, schoolId: tx.schoolId })),
        });
      }

      const fresh = await tx.db.schoolMembership.findUniqueOrThrow({
        where: { id: created.id },
        select: MEMBER_SELECT,
      });

      await this.audit.record(
        tx,
        {
          action: 'membership.invited',
          entityType: 'school_membership',
          entityId: created.id,
          after: { email: user.email, roles: input.roleIds },
          metadata: { userId: user.id },
        },
        meta,
      );

      return fresh;
    });

    // Send invitation email in the background
    let inviteUrl: string;
    let template: 'schoolInvite' | 'schoolInviteNewUser';

    if (user.hasCredential) {
      inviteUrl = schoolUrl(this.config, tenant.school.slug);
      template = 'schoolInvite';
    } else {
      const token = await this.tokens.issue(user.id, 'password_reset', INVITE_TOKEN_TTL_MS);
      inviteUrl = `${schoolUrl(this.config, tenant.school.slug)}/reset-password?token=${token}&mode=invite`;
      template = 'schoolInviteNewUser';
    }

    await this.mail.send({
      to: user.email,
      template,
      locale: user.locale ?? tenant.school.defaultLocale,
      name: user.name,
      url: inviteUrl,
    });

    return toMemberDto(member);
  }

  /** Suspends or reactivates a school membership. */
  async updateStatus(
    tenant: TenantContext,
    membershipId: string,
    input: UpdateMemberStatusInput,
    meta: RequestMeta,
  ): Promise<MemberDto> {
    return this.db.withTenant(tenant, async (tx) => {
      await this.members.lockRoleChanges(tx);

      const member = await this.members.findById(tx, membershipId);
      if (!member) throw memberNotFound();

      if (member.status === input.status) return toMemberDto(member);

      const roleIds = member.roles.map(({ role }) => role.id);
      const roles = await this.members.findAssignableRoles(tx, roleIds);
      const memberGrants = PermissionSet.fromGrants(
        roles.flatMap((r) => schoolGrants(r.grants)),
      );
      if (!tenant.permissions.covers(memberGrants)) {
        throw AppError.forbidden(
          'ROLE_ASSIGNMENT_FORBIDDEN',
          'You cannot modify the status of a member with permissions broader than your own',
        );
      }

      const hasOwnerRole = member.roles.some(({ role }) => role.key === 'school_owner');
      if (hasOwnerRole && input.status !== 'active' && (await this.members.countActiveOwners(tx)) <= 1) {
        throw AppError.conflict('LAST_OWNER_REQUIRED', 'A school must keep at least one active School Owner');
      }

      const updated = await tx.db.schoolMembership.update({
        where: { id: membershipId, schoolId: tx.schoolId },
        data: { status: input.status },
        select: MEMBER_SELECT,
      });

      await this.audit.record(
        tx,
        {
          action: 'membership.status_updated',
          entityType: 'school_membership',
          entityId: membershipId,
          before: { status: member.status },
          after: { status: updated.status },
          metadata: { userId: member.user.id },
        },
        meta,
      );

      return toMemberDto(updated);
    });
  }

  /** Soft-removes a school member. */
  remove(tenant: TenantContext, membershipId: string, meta: RequestMeta): Promise<MemberDto> {
    return this.updateStatus(tenant, membershipId, { status: 'removed' }, meta);
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
