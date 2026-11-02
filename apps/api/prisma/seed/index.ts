/**
 * Development seed: `pnpm db:seed` (idempotent — safe to run repeatedly).
 *
 * Connects with SYSTEM_DATABASE_URL, the same trusted role the API uses for
 * cross-tenant work. Later modules (students, attendance, exams, fees, ...) add their
 * own seed files next to this one and call them from main().
 */
import { loadConfig, loadDotEnv } from '../../src/config/env.js';
import { createPrismaClient, type PrismaClient } from '../../src/infrastructure/database/prisma.js';
import { syncAccessControl } from '../../src/modules/access-control/access-control-sync.js';
import { PasswordService } from '../../src/modules/auth/password.service.js';
import { PLATFORM_OWNER, SCHOOLS, SEED_PASSWORD, type SeedSchool } from './data.js';

async function upsertUser(db: PrismaClient, email: string, name: string, passwordHash: string): Promise<string> {
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, emailVerifiedAt: new Date(), credential: { create: { passwordHash } } },
    update: { name },
    select: { id: true },
  });
  await db.userCredential.upsert({
    where: { userId: user.id },
    create: { userId: user.id, passwordHash },
    update: {},
    select: { userId: true },
  });
  return user.id;
}

async function systemRoleIds(db: PrismaClient): Promise<Map<string, string>> {
  const roles = await db.role.findMany({ where: { schoolId: null }, select: { id: true, key: true } });
  return new Map(roles.map((role) => [role.key!, role.id]));
}

async function seedSchool(db: PrismaClient, school: SeedSchool, passwordHash: string, systemRoles: Map<string, string>) {
  const { customRoles, people, customDomain, ...fields } = school;
  const record = await db.school.upsert({
    where: { slug: school.slug },
    create: { ...fields, onboardingStatus: 'completed' },
    update: { name: fields.name, status: fields.status },
    select: { id: true },
  });
  const schoolId = record.id;

  if (customDomain) {
    await db.schoolDomain.upsert({
      where: { domain: customDomain },
      create: { schoolId, domain: customDomain, verifiedAt: new Date() },
      update: {},
      select: { id: true },
    });
  }

  const customRoleIds = new Map<string, string>();
  for (const role of customRoles) {
    const created = await db.role.upsert({
      where: { schoolId_name: { schoolId, name: role.name } },
      create: { schoolId, realm: 'school', name: role.name, description: role.description },
      update: { description: role.description },
      select: { id: true },
    });
    customRoleIds.set(`custom:${role.name}`, created.id);
    await db.rolePermission.createMany({
      data: Object.entries(role.grants).map(([permissionKey, scope]) => ({ roleId: created.id, permissionKey, scope })),
      skipDuplicates: true,
    });
  }

  for (const person of people) {
    const userId = await upsertUser(db, person.email, person.name, passwordHash);
    const membership = await db.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId, userId } },
      create: { schoolId, userId, status: 'active' },
      update: {},
      select: { id: true },
    });
    const roleIds = person.roles.map((key) => {
      const id = key.startsWith('custom:') ? customRoleIds.get(key) : systemRoles.get(key);
      if (!id) throw new Error(`Unknown seed role "${key}" for ${person.email}`);
      return id;
    });
    await db.membershipRole.createMany({
      data: roleIds.map((roleId) => ({ membershipId: membership.id, roleId, schoolId })),
      skipDuplicates: true,
    });
  }
  return { slug: school.slug, members: people.length };
}

async function main(): Promise<void> {
  loadDotEnv();
  const config = loadConfig();
  if (config.env === 'production') throw new Error('Refusing to seed a production environment');

  const db = createPrismaClient({ connectionString: config.database.systemUrl, poolMax: 4, applicationName: 'eduflow-seed' });
  try {
    const sync = await syncAccessControl(db);
    console.log(`Access control: ${sync.permissions} permissions, ${sync.roles} system roles`);

    const passwordHash = await new PasswordService().hash(SEED_PASSWORD);
    const systemRoles = await systemRoleIds(db);

    const ownerId = await upsertUser(db, PLATFORM_OWNER.email, PLATFORM_OWNER.name, passwordHash);
    const platformOwnerRole = systemRoles.get('platform_owner');
    if (!platformOwnerRole) throw new Error('platform_owner role missing');
    await db.platformMembership.upsert({
      where: { userId: ownerId },
      create: { userId: ownerId, roleId: platformOwnerRole, status: 'active' },
      update: {},
      select: { userId: true },
    });

    for (const school of SCHOOLS) {
      const result = await seedSchool(db, school, passwordHash, systemRoles);
      console.log(`School "${result.slug}": ${result.members} members`);
    }

    console.log(`\nSeeded. Every account's password is: ${SEED_PASSWORD}`);
    console.log('  Platform admin  http://admin.localhost:3100     owner@eduflow.test');
    console.log('  Greenfield      http://greenfield.localhost:3100 admin@greenfield.test, teacher01@greenfield.test');
    console.log('  Riverside       http://riverside.localhost:3100  admin@riverside.test');
    console.log('  Both schools    shared.teacher@eduflow.test');
    console.log('  Account host    http://localhost:3100           any of the above');
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
