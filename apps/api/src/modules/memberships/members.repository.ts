import { Injectable } from '@nestjs/common';
import type { ListMembersQuery } from '@shikkhacore/types';

import { decodeCursor } from '../../common/http/cursor.js';
import type { TenantTx } from '../../infrastructure/database/app-database.js';
import type { Prisma } from '../../infrastructure/database/prisma.js';

export const MEMBER_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  roles: {
    select: { role: { select: { id: true, key: true, name: true, schoolId: true } } },
    orderBy: { createdAt: 'asc' },
  },
} as const satisfies Prisma.SchoolMembershipSelect;

export type MemberRow = Prisma.SchoolMembershipGetPayload<{ select: typeof MEMBER_SELECT }>;

/**
 * Data access for school memberships. Every query filters by `tx.schoolId` explicitly —
 * that is the first layer of tenant isolation. Row level security on the transaction is
 * the second layer and would still hide other schools' rows if a filter were forgotten.
 */
@Injectable()
export class MembersRepository {
  /** Members ordered by name, keyset-paginated on (name, id). Fetches limit + 1 rows. */
  list(tx: TenantTx, query: ListMembersQuery): Promise<MemberRow[]> {
    const after = query.cursor ? decodeCursor(query.cursor, ['name', 'id']) : null;
    const filters: Prisma.SchoolMembershipWhereInput[] = [];
    if (query.q) {
      filters.push({
        OR: [
          { user: { name: { contains: query.q, mode: 'insensitive' } } },
          { user: { email: { contains: query.q, mode: 'insensitive' } } },
        ],
      });
    }
    if (after) {
      filters.push({
        OR: [{ user: { name: { gt: after.name } } }, { user: { name: after.name }, id: { gt: after.id } }],
      });
    }
    return tx.db.schoolMembership.findMany({
      where: {
        schoolId: tx.schoolId,
        status: query.status ?? { not: 'removed' },
        ...(query.roleId ? { roles: { some: { roleId: query.roleId } } } : {}),
        AND: filters,
      },
      orderBy: [{ user: { name: 'asc' } }, { id: 'asc' }],
      take: query.limit + 1,
      select: MEMBER_SELECT,
    });
  }

  findById(tx: TenantTx, membershipId: string): Promise<MemberRow | null> {
    return tx.db.schoolMembership.findFirst({
      where: { id: membershipId, schoolId: tx.schoolId },
      select: MEMBER_SELECT,
    });
  }

  /** School-realm roles assignable in this school: system roles and its own custom roles. */
  findAssignableRoles(tx: TenantTx, roleIds: readonly string[]) {
    return tx.db.role.findMany({
      where: { id: { in: [...roleIds] }, realm: 'school', OR: [{ schoolId: null }, { schoolId: tx.schoolId }] },
      select: { id: true, key: true, grants: { select: { permissionKey: true, scope: true } } },
    });
  }

  countActiveOwners(tx: TenantTx): Promise<number> {
    return tx.db.schoolMembership.count({
      where: { schoolId: tx.schoolId, status: 'active', roles: { some: { role: { key: 'school_owner' } } } },
    });
  }

  /** Serialises role changes within one school, so two admins cannot race past the last-owner check. */
  async lockRoleChanges(tx: TenantTx): Promise<void> {
    await tx.db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`membership-roles:${tx.schoolId}`}))`;
  }

  async replaceRoles(tx: TenantTx, membershipId: string, roleIds: readonly string[]): Promise<void> {
    await tx.db.membershipRole.deleteMany({ where: { membershipId, schoolId: tx.schoolId } });
    await tx.db.membershipRole.createMany({
      data: roleIds.map((roleId) => ({ membershipId, roleId, schoolId: tx.schoolId })),
    });
  }
}
