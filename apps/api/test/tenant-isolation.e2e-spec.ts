/**
 * Tenant isolation at the API level: authenticated as a School A user, every attempt to
 * reach School B data must fail without revealing anything about School B.
 */
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { MemberDto, RoleDto } from '@eduflow/types';
import request from 'supertest';

import {
  addMember,
  createCustomRole,
  createSchool,
  createUser,
  login,
  makePlatformStaff,
  type TestSchool,
  type TestUser,
} from './support/fixtures.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const ROOT = 'localhost';
const PLATFORM = 'admin.localhost';

describe('tenant isolation (API level)', () => {
  let t: TestApp;
  let schoolA: TestSchool;
  let schoolB: TestSchool;
  let adminA: TestUser;
  let teacherA: TestUser;
  let adminB: TestUser;
  let shared: TestUser;
  let memberIdA: string;
  let memberIdB: string;
  let customRoleB: { id: string; name: string };
  let cookieA: string;

  beforeAll(async () => {
    t = await createTestApp();
    schoolA = await createSchool(t.db, { name: 'School A' });
    schoolB = await createSchool(t.db, { name: 'School B' });
    adminA = await createUser(t.db, { name: 'Admin A' });
    teacherA = await createUser(t.db, { name: 'Teacher A' });
    adminB = await createUser(t.db, { name: 'Admin B' });
    shared = await createUser(t.db, { name: 'Shared Teacher' });

    await addMember(t.db, schoolA, adminA, ['school_admin']);
    memberIdA = await addMember(t.db, schoolA, teacherA, ['teacher']);
    memberIdB = await addMember(t.db, schoolB, adminB, ['school_admin']);
    await addMember(t.db, schoolA, shared, ['teacher']);
    await addMember(t.db, schoolB, shared, ['teacher', 'guardian']);
    customRoleB = await createCustomRole(t.db, schoolB, { 'school.view': 'all' });

    cookieA = await login(t.http, schoolA.host, adminA);
  });

  afterAll(() => t.close());

  const get = (host: string, path: string, cookie: string) =>
    request(t.http).get(`/api/v1${path}`).set('Host', host).set('Cookie', cookie);

  it('lists only the current school’s members', async () => {
    const res = await get(schoolA.host, '/members?limit=100', cookieA).expect(200);
    const emails = (res.body.data as MemberDto[]).map((member) => member.user.email).sort();
    expect(emails).toEqual([adminA.email, shared.email, teacherA.email].sort());
    expect(emails).not.toContain(adminB.email);
  });

  it('answers 404 for another school’s member, exactly as for a missing one', async () => {
    const res = await get(schoolA.host, `/members/${memberIdB}`, cookieA).expect(404);
    expect(res.body.error.code).toBe('MEMBER_NOT_FOUND');
    const missing = await get(schoolA.host, '/members/01999999-0000-7000-8000-000000000000', cookieA).expect(404);
    expect(missing.body.error).toMatchObject({ code: res.body.error.code, message: res.body.error.message });
  });

  it('cannot change another school’s member or assign another school’s role', async () => {
    const teacherRole = await t.db.role.findUniqueOrThrow({ where: { key: 'teacher' }, select: { id: true } });
    await request(t.http)
      .put(`/api/v1/members/${memberIdB}/roles`)
      .set('Host', schoolA.host)
      .set('Cookie', cookieA)
      .send({ roleIds: [teacherRole.id] })
      .expect(404);

    const res = await request(t.http)
      .put(`/api/v1/members/${memberIdA}/roles`)
      .set('Host', schoolA.host)
      .set('Cookie', cookieA)
      .send({ roleIds: [customRoleB.id] })
      .expect(404);
    expect(res.body.error.code).toBe('ROLE_NOT_FOUND');
  });

  it('never lists another school’s custom roles', async () => {
    const res = await get(schoolA.host, '/roles', cookieA).expect(200);
    const ids = (res.body.data as RoleDto[]).map((role) => role.id);
    expect(ids).not.toContain(customRoleB.id);
  });

  it('ignores school ids supplied by the client', async () => {
    const res = await request(t.http)
      .get(`/api/v1/members?limit=100&schoolId=${schoolB.id}`)
      .set('Host', schoolA.host)
      .set('Cookie', cookieA)
      .set('X-School-Id', schoolB.id)
      .expect(200);
    const emails = (res.body.data as MemberDto[]).map((member) => member.user.email);
    expect(emails).toContain(adminA.email);
    expect(emails).not.toContain(adminB.email);
  });

  it('rejects a session presented through a forwarded host it was not issued for', async () => {
    // Loopback is a trusted proxy in tests, so X-Forwarded-Host is honoured — and the
    // session, bound to School A's host, is then refused.
    await request(t.http)
      .get('/api/v1/members')
      .set('Host', schoolA.host)
      .set('X-Forwarded-Host', schoolB.host)
      .set('Cookie', cookieA)
      .expect(401);
  });

  it('binds session cookies to the host they were issued on', async () => {
    const res = await get(schoolB.host, '/members', cookieA).expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    await get(ROOT, '/me/schools', cookieA).expect(401);
    await get(PLATFORM, '/auth/session', cookieA).expect(401);
  });

  it('refuses sign-in to a school the user does not belong to', async () => {
    const res = await request(t.http)
      .post('/api/v1/auth/login')
      .set('Host', schoolB.host)
      .send({ email: adminA.email, password: adminA.password })
      .expect(403);
    expect(res.body.error.code).toBe('TENANT_ACCESS_DENIED');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('gives a member of both schools only the school of the current host', async () => {
    for (const [school, other] of [
      [schoolA, schoolB],
      [schoolB, schoolA],
    ] as const) {
      const cookie = await login(t.http, school.host, shared);
      const session = await get(school.host, '/auth/session', cookie).expect(200);
      expect(session.body.data.tenant.school.id).toBe(school.id);
      expect(session.body.data.tenant.school.id).not.toBe(other.id);
    }
    const inB = await login(t.http, schoolB.host, shared);
    const session = await get(schoolB.host, '/auth/session', inB).expect(200);
    const roleKeys = (session.body.data.tenant.roles as { key: string }[]).map((role) => role.key).sort();
    expect(roleKeys).toEqual(['guardian', 'teacher']);
  });

  it('on the account host requires a school selection verified against membership', async () => {
    const cookie = await login(t.http, ROOT, adminA);
    const noSchool = await get(ROOT, '/members', cookie).expect(400);
    expect(noSchool.body.error.code).toBe('TENANT_REQUIRED');

    const denied = await request(t.http)
      .put('/api/v1/auth/session/school')
      .set('Host', ROOT)
      .set('Cookie', cookie)
      .send({ schoolId: schoolB.id })
      .expect(403);
    expect(denied.body.error.code).toBe('TENANT_ACCESS_DENIED');

    await request(t.http)
      .put('/api/v1/auth/session/school')
      .set('Host', ROOT)
      .set('Cookie', cookie)
      .send({ schoolId: schoolA.id })
      .expect(200);
    const members = await get(ROOT, '/members?limit=100', cookie).expect(200);
    const emails = (members.body.data as MemberDto[]).map((member) => member.user.email);
    expect(emails).toContain(adminA.email);
    expect(emails).not.toContain(adminB.email);

    const mine = await get(ROOT, '/me/schools', cookie).expect(200);
    expect((mine.body.data as { school: { id: string } }[]).map((m) => m.school.id)).toEqual([schoolA.id]);
  });

  it('keeps platform administration separate from school context', async () => {
    const fromSchool = await get(schoolA.host, '/platform/schools', cookieA).expect(403);
    expect(fromSchool.body.error.code).toBe('PLATFORM_ACCESS_DENIED');

    const staff = await createUser(t.db, { name: 'Platform Staff' });
    await makePlatformStaff(t.db, staff);
    const cookie = await login(t.http, PLATFORM, staff);
    const schools = await get(PLATFORM, '/platform/schools?limit=100', cookie).expect(200);
    const ids = (schools.body.data as { id: string }[]).map((school) => school.id);
    expect(ids).toEqual(expect.arrayContaining([schoolA.id, schoolB.id]));

    // Platform staff get no implicit school context on the platform host.
    const tenantRoute = await get(PLATFORM, '/members', cookie).expect(400);
    expect(tenantRoute.body.error.code).toBe('TENANT_REQUIRED');

    // School staff cannot sign in to the platform host.
    const res = await request(t.http)
      .post('/api/v1/auth/login')
      .set('Host', PLATFORM)
      .send({ email: adminA.email, password: adminA.password })
      .expect(403);
    expect(res.body.error.code).toBe('PLATFORM_ACCESS_DENIED');
  });
});
