import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { addMember, createSchool, createUser, login, type TestSchool, type TestUser } from './support/fixtures.js';
import { createTestApp, type TestApp } from './support/test-app.js';

describe('authorisation and role management', () => {
  let t: TestApp;
  let school: TestSchool;
  let owner: TestUser;
  let admin: TestUser;
  let teacher: TestUser;
  let ownerMembership: string;
  let teacherMembership: string;
  let roleIds: Record<string, string>;

  beforeAll(async () => {
    t = await createTestApp();
    school = await createSchool(t.db);
    owner = await createUser(t.db);
    admin = await createUser(t.db);
    teacher = await createUser(t.db);
    ownerMembership = await addMember(t.db, school, owner, ['school_owner']);
    await addMember(t.db, school, admin, ['school_admin']);
    teacherMembership = await addMember(t.db, school, teacher, ['teacher']);
    const roles = await t.db.role.findMany({ where: { schoolId: null }, select: { id: true, key: true } });
    roleIds = Object.fromEntries(roles.map((role) => [role.key!, role.id]));
  });

  afterAll(() => t.close());

  const as = async (user: TestUser) => {
    const cookie = await login(t.http, school.host, user);
    return {
      get: (path: string) => request(t.http).get(`/api/v1${path}`).set('Host', school.host).set('Cookie', cookie),
      put: (path: string, body: object) =>
        request(t.http).put(`/api/v1${path}`).set('Host', school.host).set('Cookie', cookie).send(body),
    };
  };

  it('exposes each member’s merged permissions and scopes', async () => {
    const api = await as(teacher);
    const res = await api.get('/auth/session').expect(200);
    const grants = res.body.data.tenant.permissions as { key: string; scope: string }[];
    expect(grants).toEqual(expect.arrayContaining([{ key: 'students.view', scope: 'assigned' }]));
    expect(grants.map((grant) => grant.key)).not.toContain('users.view');
  });

  it('denies routes the member lacks permission for', async () => {
    const api = await as(teacher);
    const res = await api.get('/members').expect(403);
    expect(res.body.error).toMatchObject({ code: 'PERMISSION_DENIED', details: { required: ['users.view'] } });
    await api.get('/school').expect(200);
  });

  it('lets an admin assign roles and records the change in the audit log', async () => {
    const api = await as(admin);
    const res = await api
      .put(`/members/${teacherMembership}/roles`, { roleIds: [roleIds.teacher, roleIds.guardian] })
      .expect(200);
    const roles = (res.body.data as { roles: { key: string }[] }).roles;
    expect(roles.map((role) => role.key).sort()).toEqual(['guardian', 'teacher']);

    const entry = await t.db.auditLog.findFirstOrThrow({
      where: { schoolId: school.id, action: 'membership.roles_updated', entityId: teacherMembership },
      orderBy: { createdAt: 'desc' },
    });
    const actor = await t.db.user.findUniqueOrThrow({ where: { id: entry.actorUserId! }, select: { email: true } });
    expect(actor.email).toBe(admin.email);
    expect(entry.before).toEqual({ roles: [expect.objectContaining({ key: 'teacher' })] });
    expect(entry.requestId).toBeTruthy();
  });

  it('blocks privilege escalation: an admin cannot grant or remove the owner role', async () => {
    const api = await as(admin);
    const grant = await api
      .put(`/members/${teacherMembership}/roles`, { roleIds: [roleIds.school_owner] })
      .expect(403);
    expect(grant.body.error.code).toBe('ROLE_ASSIGNMENT_FORBIDDEN');

    const strip = await api.put(`/members/${ownerMembership}/roles`, { roleIds: [roleIds.teacher] }).expect(403);
    expect(strip.body.error.code).toBe('ROLE_ASSIGNMENT_FORBIDDEN');
  });

  it('keeps at least one school owner', async () => {
    const api = await as(owner);
    const res = await api.put(`/members/${ownerMembership}/roles`, { roleIds: [roleIds.school_admin] }).expect(409);
    expect(res.body.error.code).toBe('LAST_OWNER_REQUIRED');
  });

  it('rejects platform roles and unknown roles', async () => {
    const api = await as(owner);
    const platform = await api.put(`/members/${teacherMembership}/roles`, { roleIds: [roleIds.platform_owner] }).expect(404);
    expect(platform.body.error.code).toBe('ROLE_NOT_FOUND');
    await api.put(`/members/${teacherMembership}/roles`, { roleIds: [] }).expect(400);
    await api.put(`/members/${teacherMembership}/roles`, { roleIds: ['not-a-uuid'] }).expect(400);
  });

  it('lists the role catalog for role editors', async () => {
    const api = await as(admin);
    const roles = await api.get('/roles').expect(200);
    const teacherRole = (roles.body.data as { key: string; isSystem: boolean; grants: unknown[] }[]).find(
      (role) => role.key === 'teacher',
    );
    expect(teacherRole).toMatchObject({ isSystem: true });
    const permissions = await api.get('/permissions').expect(200);
    expect(permissions.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'results.publish', scopes: ['all'] })]),
    );
  });

  it('paginates members by name with an opaque cursor', async () => {
    const api = await as(admin);
    const first = await api.get('/members?limit=2').expect(200);
    expect(first.body.data).toHaveLength(2);
    expect(first.body.meta.nextCursor).toEqual(expect.any(String));
    const second = await api.get(`/members?limit=2&cursor=${first.body.meta.nextCursor}`).expect(200);
    const names = [...first.body.data, ...second.body.data].map((member: { user: { name: string } }) => member.user.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(second.body.meta.nextCursor).toBeNull();
    await api.get('/members?cursor=%%%').expect(400);
  });
});
