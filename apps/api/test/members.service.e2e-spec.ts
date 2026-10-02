/**
 * Tenant isolation at the SERVICE level: services called directly with School A's
 * verified context can never return or modify School B rows — and RLS still holds when
 * a query forgets its tenant filter.
 */
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { AppDatabase } from '../src/infrastructure/database/app-database.js';
import { MembersService } from '../src/modules/memberships/members.service.js';
import { TenantResolverService } from '../src/modules/tenancy/tenant-resolver.service.js';
import type { TenantContext } from '../src/modules/tenancy/tenant-context.js';
import { addMember, createSchool, createUser, type TestSchool, type TestUser } from './support/fixtures.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const meta = { ipAddress: '127.0.0.1', userAgent: 'jest', requestId: 'members-service-test' };

describe('tenant isolation (service level)', () => {
  let t: TestApp;
  let members: MembersService;
  let db: AppDatabase;
  let tenants: TenantResolverService;
  let schoolA: TestSchool;
  let schoolB: TestSchool;
  let adminA: TestUser;
  let memberIdB: string;
  let tenantA: TenantContext;

  beforeAll(async () => {
    t = await createTestApp();
    members = t.app.get(MembersService);
    db = t.app.get(AppDatabase);
    tenants = t.app.get(TenantResolverService);

    schoolA = await createSchool(t.db);
    schoolB = await createSchool(t.db);
    adminA = await createUser(t.db);
    const adminB = await createUser(t.db);
    await addMember(t.db, schoolA, adminA, ['school_owner']);
    memberIdB = await addMember(t.db, schoolB, adminB, ['school_admin']);

    const resolved = await tenants.load(schoolA.id, adminA.id);
    if (!resolved) throw new Error('expected a tenant context for School A');
    tenantA = resolved;
  });

  afterAll(() => t.close());

  it('resolves no tenant context for a school the user does not belong to', async () => {
    await expect(tenants.load(schoolB.id, adminA.id)).resolves.toBeNull();
  });

  it('reports another school’s member as not found', async () => {
    await expect(members.get(tenantA, memberIdB)).rejects.toMatchObject({ code: 'MEMBER_NOT_FOUND' });
  });

  it('never lists another school’s members', async () => {
    const page = await members.list(tenantA, { limit: 100 });
    expect(page.items.map((member) => member.user.id)).toEqual([adminA.id]);
  });

  it('cannot modify another school’s member', async () => {
    const teacher = await t.db.role.findUniqueOrThrow({ where: { key: 'teacher' }, select: { id: true } });
    await expect(members.updateRoles(tenantA, memberIdB, { roleIds: [teacher.id] }, meta)).rejects.toMatchObject({
      code: 'MEMBER_NOT_FOUND',
    });
  });

  it('still isolates tenants when a query forgets its school filter (RLS is the second layer)', async () => {
    const rows = await db.withTenant(tenantA, (tx) =>
      // Deliberately unfiltered — simulates a bug in a repository.
      tx.db.schoolMembership.findMany({ select: { schoolId: true } }),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.schoolId === schoolA.id)).toBe(true);
  });
});
