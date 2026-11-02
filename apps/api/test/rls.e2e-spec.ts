/**
 * Tenant isolation at the DATABASE level. These tests talk to PostgreSQL directly as
 * the `eduflow_app` role, bypassing all application code, to prove that row level
 * security alone keeps schools apart.
 */
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { loadConfig, type AppConfig } from '../src/config/env.js';
import { AppDatabase } from '../src/infrastructure/database/app-database.js';
import { assertRowLevelSecurityEnforced } from '../src/infrastructure/database/database-safety.js';
import { createPrismaClient, type PrismaClient } from '../src/infrastructure/database/prisma.js';
import { syncAccessControl } from '../src/modules/access-control/access-control-sync.js';
import {
  addMember,
  createCustomRole,
  createSchool,
  createUser,
  type TestSchool,
  type TestUser,
} from './support/fixtures.js';

/** Tables intentionally without RLS: Prisma's bookkeeping and the global read-only permission catalog. */
const TABLES_WITHOUT_RLS = ['_prisma_migrations', 'permissions'];

describe('row level security (database level)', () => {
  let config: AppConfig;
  let system: PrismaClient;
  let appRaw: PrismaClient;
  let appDb: AppDatabase;

  let schoolA: TestSchool;
  let schoolB: TestSchool;
  let userA: TestUser;
  let otherA: TestUser;
  let userB: TestUser;
  let membershipB: string;
  let customRoleB: { id: string };

  beforeAll(async () => {
    config = loadConfig();
    system = createPrismaClient({ connectionString: config.database.systemUrl, poolMax: 2, applicationName: 'rls-test-system' });
    appRaw = createPrismaClient({ connectionString: config.database.appUrl, poolMax: 1, applicationName: 'rls-test-app' });
    appDb = new AppDatabase(config);
    await appDb.onModuleInit();
    await syncAccessControl(system);

    schoolA = await createSchool(system);
    schoolB = await createSchool(system);
    userA = await createUser(system);
    otherA = await createUser(system);
    userB = await createUser(system);
    await addMember(system, schoolA, userA, ['school_admin']);
    await addMember(system, schoolA, otherA, ['teacher']);
    membershipB = await addMember(system, schoolB, userB, ['school_admin']);
    customRoleB = await createCustomRole(system, schoolB, { 'school.view': 'all' });
    await system.auditLog.create({
      data: { schoolId: schoolB.id, actorUserId: userB.id, action: 'test.event', entityType: 'test' },
    });
  });

  afterAll(async () => {
    await appDb.onModuleDestroy();
    await Promise.all([system.$disconnect(), appRaw.$disconnect()]);
  });

  it('shows no tenant data when no context is set (fails closed)', async () => {
    expect(await appRaw.school.count()).toBe(0);
    expect(await appRaw.schoolMembership.count()).toBe(0);
    expect(await appRaw.membershipRole.count()).toBe(0);
    expect(await appRaw.user.count()).toBe(0);
    expect(await appRaw.auditLog.count()).toBe(0);
    expect(await appRaw.role.count({ where: { schoolId: { not: null } } })).toBe(0);
  });

  it('exposes only the current school inside a school context', async () => {
    await appDb.withTenant({ schoolId: schoolA.id, userId: userA.id }, async (tx) => {
      const schools = await tx.db.school.findMany({ select: { id: true } });
      expect(schools.map((school) => school.id)).toEqual([schoolA.id]);

      const memberships = await tx.db.schoolMembership.findMany({ select: { schoolId: true } });
      expect(memberships.length).toBe(2);
      expect(new Set(memberships.map((m) => m.schoolId))).toEqual(new Set([schoolA.id]));

      const users = await tx.db.user.findMany({ select: { id: true } });
      expect(new Set(users.map((user) => user.id))).toEqual(new Set([userA.id, otherA.id]));

      expect(await tx.db.auditLog.count()).toBe(0);
      expect(await tx.db.role.count({ where: { schoolId: schoolB.id } })).toBe(0);
    });
  });

  it('returns nothing when another school’s rows are requested by id', async () => {
    await appDb.withTenant({ schoolId: schoolA.id, userId: userA.id }, async (tx) => {
      expect(await tx.db.school.findUnique({ where: { id: schoolB.id } })).toBeNull();
      expect(await tx.db.schoolMembership.findUnique({ where: { id: membershipB } })).toBeNull();
      expect(await tx.db.user.findUnique({ where: { id: userB.id } })).toBeNull();
      expect(await tx.db.role.findUnique({ where: { id: customRoleB.id } })).toBeNull();
      expect(await tx.db.rolePermission.count({ where: { roleId: customRoleB.id } })).toBe(0);
    });
  });

  it('rejects writes into another school', async () => {
    const asA = { schoolId: schoolA.id, userId: userA.id };

    await expect(
      appDb.withTenant(asA, (tx) => tx.db.schoolMembership.create({ data: { schoolId: schoolB.id, userId: userA.id } })),
    ).rejects.toThrow(/row-level security/i);

    await expect(
      appDb.withTenant(asA, (tx) =>
        tx.db.auditLog.create({
          data: { schoolId: schoolB.id, actorUserId: userA.id, action: 'forged', entityType: 'test' },
        }),
      ),
    ).rejects.toThrow(/row-level security/i);

    await expect(
      appDb.withTenant(asA, (tx) =>
        tx.db.schoolDomain.create({ data: { schoolId: schoolB.id, domain: 'evil.example.test' } }),
      ),
    ).rejects.toThrow(/row-level security/i);

    const updated = await appDb.withTenant(asA, (tx) =>
      tx.db.schoolMembership.updateMany({ where: { id: membershipB }, data: { status: 'suspended' } }),
    );
    expect(updated.count).toBe(0);
    const stillActive = await system.schoolMembership.findUnique({ where: { id: membershipB }, select: { status: true } });
    expect(stillActive?.status).toBe('active');
  });

  it('cannot forge audit entries for another user, even within the same school', async () => {
    await expect(
      appDb.withTenant({ schoolId: schoolA.id, userId: userA.id }, (tx) =>
        tx.db.auditLog.create({
          data: { schoolId: schoolA.id, actorUserId: otherA.id, action: 'forged', entityType: 'test' },
        }),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('scopes context to the transaction so pooled connections never leak it', async () => {
    // poolMax is 1, so both statements run on the same physical connection.
    await appRaw.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.school_id', ${schoolA.id}, true), set_config('app.user_id', ${userA.id}, true)`;
      expect(await tx.schoolMembership.count()).toBe(2);
    });
    const [setting] = await appRaw.$queryRaw<{ value: string | null }[]>`SELECT current_setting('app.school_id', true) AS value`;
    expect(setting?.value ?? '').toBe('');
    expect(await appRaw.schoolMembership.count()).toBe(0);
  });

  it('with only a user context exposes the user’s own memberships, not their schoolmates', async () => {
    await appDb.withUser(userA.id, async (tx) => {
      const memberships = await tx.db.schoolMembership.findMany({ select: { userId: true } });
      expect(memberships.map((m) => m.userId)).toEqual([userA.id]);
      expect((await tx.db.school.findMany({ select: { id: true } })).map((s) => s.id)).toEqual([schoolA.id]);
      expect((await tx.db.user.findMany({ select: { id: true } })).map((u) => u.id)).toEqual([userA.id]);
    });
  });

  it('denies the app role any access to credentials, sessions, tokens and platform staff', async () => {
    for (const table of ['user_credentials', 'sessions', 'auth_tokens', 'platform_memberships']) {
      await expect(appRaw.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`)).rejects.toThrow(/permission denied/i);
    }
  });

  it('lets users edit only their own profile, and only profile columns', async () => {
    await appDb.withTenant({ schoolId: schoolA.id, userId: userA.id }, async (tx) => {
      const other = await tx.db.user.updateMany({ where: { id: otherA.id }, data: { name: 'Hijacked' } });
      expect(other.count).toBe(0);
      const own = await tx.db.user.updateMany({ where: { id: userA.id }, data: { name: 'Renamed' } });
      expect(own.count).toBe(1);
    });
    await expect(
      appDb.withTenant({ schoolId: schoolA.id, userId: userA.id }, (tx) =>
        tx.db.user.update({ where: { id: userA.id }, data: { email: 'takeover@example.test' } }),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it('keeps the audit log append-only for every role', async () => {
    const entry = await system.auditLog.findFirstOrThrow({ where: { schoolId: schoolB.id }, select: { id: true } });
    await expect(system.auditLog.update({ where: { id: entry.id }, data: { action: 'tampered' } })).rejects.toThrow();
    await expect(system.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow();
    await expect(system.$executeRawUnsafe('TRUNCATE audit_logs')).rejects.toThrow();
  });

  it('enforces role integrity rules in the database', async () => {
    const membershipA = await system.schoolMembership.findFirstOrThrow({
      where: { schoolId: schoolA.id, userId: userA.id },
      select: { id: true },
    });
    // Another school's custom role cannot be assigned.
    await expect(
      system.membershipRole.create({ data: { membershipId: membershipA.id, roleId: customRoleB.id, schoolId: schoolA.id } }),
    ).rejects.toThrow(/cannot be assigned/);

    // Platform roles cannot be held through a school membership.
    const platformRole = await system.role.findUniqueOrThrow({ where: { key: 'platform_owner' }, select: { id: true } });
    await expect(
      system.membershipRole.create({ data: { membershipId: membershipA.id, roleId: platformRole.id, schoolId: schoolA.id } }),
    ).rejects.toThrow(/cannot be assigned/);

    // Platform permissions cannot be granted to school roles, and scopes must be allowed.
    await expect(
      system.rolePermission.create({ data: { roleId: customRoleB.id, permissionKey: 'platform.schools.view', scope: 'all' } }),
    ).rejects.toThrow(/cannot be granted/);
    await expect(
      system.rolePermission.create({ data: { roleId: customRoleB.id, permissionKey: 'results.publish', scope: 'own' } }),
    ).rejects.toThrow(/not allowed/);

    // Membership roles are pinned to the membership's school (composite foreign key).
    const teacherRole = await system.role.findUniqueOrThrow({ where: { key: 'teacher' }, select: { id: true } });
    await expect(
      system.membershipRole.create({ data: { membershipId: membershipB, roleId: teacherRole.id, schoolId: schoolA.id } }),
    ).rejects.toThrow(/foreign key/i);
  });

  it('protects every tenant table with RLS and an app-role policy', async () => {
    const tables = await system.$queryRaw<{ table: string; rls: boolean; has_school_id: boolean; app_policies: number }[]>`
      SELECT c.relname AS table, c.relrowsecurity AS rls,
        EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'school_id' AND NOT a.attisdropped) AS has_school_id,
        (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname AND 'eduflow_app' = ANY (p.roles)) AS app_policies
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'`;

    expect(tables.length).toBeGreaterThan(10);
    for (const table of tables) {
      if (TABLES_WITHOUT_RLS.includes(table.table)) continue;
      expect({ table: table.table, rls: table.rls }).toEqual({ table: table.table, rls: true });
      if (table.has_school_id) {
        expect({ table: table.table, policies: table.app_policies > 0 }).toEqual({ table: table.table, policies: true });
      }
    }
  });

  it('refuses to run requests over a role that bypasses RLS', async () => {
    await expect(assertRowLevelSecurityEnforced(appRaw)).resolves.toBeUndefined();
    const owner = createPrismaClient({ connectionString: process.env.MIGRATION_DATABASE_URL!, poolMax: 1, applicationName: 'rls-test-owner' });
    try {
      await expect(assertRowLevelSecurityEnforced(owner)).rejects.toThrow(/owns \d+ tables/);
    } finally {
      await owner.$disconnect();
    }
  });
});
