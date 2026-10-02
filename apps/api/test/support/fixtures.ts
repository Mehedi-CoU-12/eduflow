import type { Server } from 'node:http';

import type { PermissionScope, SchoolPermissionKey, SystemRoleKey } from '@shikkhacore/types';
import request, { type Response } from 'supertest';

import type { PrismaClient } from '../../src/infrastructure/database/prisma.js';
import { PasswordService } from '../../src/modules/auth/password.service.js';

/**
 * Test data builders. They write through the system client so each test can set up
 * exactly the tenants it needs; names are unique per run so suites never collide.
 */
export const PASSWORD = 'Correct-Horse-Battery-9';

const run = Date.now().toString(36);
let sequence = 0;

export function unique(prefix: string): string {
  sequence += 1;
  return `${prefix}-${run}-${sequence}`;
}

const passwords = new PasswordService();
const hashes = new Map<string, Promise<string>>();
function hashOf(password: string): Promise<string> {
  let hash = hashes.get(password);
  if (!hash) {
    hash = passwords.hash(password);
    hashes.set(password, hash);
  }
  return hash;
}

export interface TestSchool {
  id: string;
  slug: string;
  name: string;
  host: string;
}

export async function createSchool(
  db: PrismaClient,
  input: { name?: string; status?: 'active' | 'suspended' } = {},
): Promise<TestSchool> {
  const slug = unique('school');
  const name = input.name ?? `School ${slug}`;
  const school = await db.school.create({
    data: { slug, name, status: input.status ?? 'active' },
    select: { id: true, slug: true, name: true },
  });
  return { ...school, host: `${slug}.localhost` };
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export async function createUser(
  db: PrismaClient,
  input: { name?: string; verified?: boolean; password?: string } = {},
): Promise<TestUser> {
  const email = `${unique('user')}@example.test`;
  const name = input.name ?? `User ${email.split('@')[0]}`;
  const password = input.password ?? PASSWORD;
  const user = await db.user.create({
    data: {
      email,
      name,
      emailVerifiedAt: input.verified === false ? null : new Date(),
      credential: { create: { passwordHash: await hashOf(password) } },
    },
    select: { id: true },
  });
  return { id: user.id, email, name, password };
}

async function roleIdsFor(db: PrismaClient, roles: readonly (SystemRoleKey | { id: string })[]): Promise<string[]> {
  const keys = roles.filter((role): role is SystemRoleKey => typeof role === 'string');
  const found = await db.role.findMany({ where: { key: { in: keys } }, select: { id: true, key: true } });
  return roles.map((role) => {
    if (typeof role !== 'string') return role.id;
    const id = found.find((row) => row.key === role)?.id;
    if (!id) throw new Error(`System role ${role} not found; did the app sync access control?`);
    return id;
  });
}

export async function addMember(
  db: PrismaClient,
  school: TestSchool,
  user: TestUser,
  roles: readonly (SystemRoleKey | { id: string })[],
  status: 'active' | 'suspended' | 'invited' = 'active',
): Promise<string> {
  const membership = await db.schoolMembership.create({
    data: { schoolId: school.id, userId: user.id, status },
    select: { id: true },
  });
  const roleIds = await roleIdsFor(db, roles);
  await db.membershipRole.createMany({
    data: roleIds.map((roleId) => ({ membershipId: membership.id, roleId, schoolId: school.id })),
  });
  return membership.id;
}

export async function createCustomRole(
  db: PrismaClient,
  school: TestSchool,
  grants: Partial<Record<SchoolPermissionKey, PermissionScope>>,
): Promise<{ id: string; name: string }> {
  const role = await db.role.create({
    data: { schoolId: school.id, realm: 'school', name: unique('Custom role') },
    select: { id: true, name: true },
  });
  await db.rolePermission.createMany({
    data: Object.entries(grants).map(([permissionKey, scope]) => ({ roleId: role.id, permissionKey, scope })),
  });
  return role;
}

export async function makePlatformStaff(db: PrismaClient, user: TestUser): Promise<void> {
  const [roleId] = await roleIdsFor(db, ['platform_owner']);
  await db.platformMembership.create({ data: { userId: user.id, roleId: roleId! }, select: { userId: true } });
}

/** Signs in through the API and returns the session cookie for later requests. */
export async function login(http: Server, host: string, user: Pick<TestUser, 'email' | 'password'>): Promise<string> {
  const res = await request(http)
    .post('/api/v1/auth/login')
    .set('Host', host)
    .send({ email: user.email, password: user.password })
    .expect(200);
  return sessionCookie(res);
}

export function sessionCookie(res: Response): string {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = header?.find((value) => value.startsWith('sc_session='));
  if (!cookie) throw new Error('No session cookie in response');
  return cookie.split(';')[0]!;
}
