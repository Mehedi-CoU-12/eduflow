import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import type { MailMessage } from '../src/infrastructure/mail/mail-transport.js';
import { addMember, createSchool, createUser, login, sessionCookie, unique, type TestSchool } from './support/fixtures.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const ROOT = 'localhost';

function tokenFrom(message: MailMessage, path: string): string {
  const match = new RegExp(`${path}\\?token=([A-Za-z0-9_-]+)`).exec(message.text);
  if (!match?.[1]) throw new Error(`No ${path} link in email`);
  return match[1];
}

describe('authentication', () => {
  let t: TestApp;
  let school: TestSchool;

  beforeAll(async () => {
    t = await createTestApp({ LOGIN_MAX_FAILURES: '3' });
    school = await createSchool(t.db);
  });

  afterAll(() => t.close());

  const post = (host: string, path: string, body: object) =>
    request(t.http).post(`/api/v1${path}`).set('Host', host).send(body);

  describe('sign-up and email verification', () => {
    it('signs up, requires verification, then signs in', async () => {
      const email = `${unique('signup')}@example.test`;
      const password = 'a-long-enough-password';

      const signup = await post(ROOT, '/auth/signup', { name: 'Rahima Begum', email, password, locale: 'bn' }).expect(202);
      expect(signup.body).toEqual({ success: true, data: { message: expect.any(String) } });

      const before = await post(ROOT, '/auth/login', { email, password }).expect(403);
      expect(before.body.error.code).toBe('EMAIL_NOT_VERIFIED');

      const mail = await t.mail.waitFor((message) => message.to === email && message.template === 'verifyEmail');
      expect(mail.subject).toContain('ইমেইল'); // rendered in the user's locale (Bangla)
      expect(mail.text).toContain('http://localhost:3100/verify-email?token=');

      await post(ROOT, '/auth/email/verify', { token: tokenFrom(mail, 'verify-email') }).expect(200);
      const reused = await post(ROOT, '/auth/email/verify', { token: tokenFrom(mail, 'verify-email') }).expect(400);
      expect(reused.body.error.code).toBe('TOKEN_INVALID');

      const res = await post(ROOT, '/auth/login', { email: email.toUpperCase(), password }).expect(200);
      expect(res.body.data.user).toMatchObject({ email, name: 'Rahima Begum', emailVerified: true, locale: 'bn' });
      expect(res.body.data.tenant).toBeNull();

      const audit = await t.db.auditLog.findMany({ where: { actor: { email } }, select: { action: true } });
      expect(audit.map((entry) => entry.action)).toEqual(
        expect.arrayContaining(['user.signed_up', 'auth.email_verified', 'auth.signed_in']),
      );
    });

    it('answers sign-up for an existing email exactly like a new one', async () => {
      const existing = await createUser(t.db);
      const res = await post(ROOT, '/auth/signup', {
        name: 'Someone Else',
        email: existing.email,
        password: 'another-long-password',
      }).expect(202);
      const fresh = await post(ROOT, '/auth/signup', {
        name: 'Fresh',
        email: `${unique('fresh')}@example.test`,
        password: 'another-long-password',
      }).expect(202);
      expect(res.body).toEqual(fresh.body);

      const notice = await t.mail.waitFor((message) => message.to === existing.email);
      expect(notice.template).toBe('accountExists');
      await login(t.http, ROOT, existing); // the attempt did not change the original password
    });

    it('rejects weak passwords with field-level details', async () => {
      const res = await post(ROOT, '/auth/signup', { name: 'X', email: 'not-an-email', password: 'short' }).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      const paths = (res.body.error.details as { path: string[] }[]).map((issue) => issue.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['email', 'password']));
    });
  });

  describe('sign-in', () => {
    it('sets a hardened, host-only session cookie', async () => {
      const user = await createUser(t.db);
      const res = await post(ROOT, '/auth/login', { email: user.email, password: user.password }).expect(200);
      const cookie = (res.headers['set-cookie'] as unknown as string[]).find((value) => value.startsWith('sc_session='))!;
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\//);
      expect(cookie).not.toMatch(/Domain=/);
      expect(sessionCookie(res).length).toBeGreaterThan(40);

      const row = await t.db.session.findFirstOrThrow({ where: { userId: user.id } });
      expect(row.tokenHash).not.toContain(sessionCookie(res).split('=')[1]); // only the hash is stored
      expect(row.host).toBe(ROOT);
    });

    it('uses one error for unknown emails and wrong passwords', async () => {
      const user = await createUser(t.db);
      const wrong = await post(ROOT, '/auth/login', { email: user.email, password: 'wrong-password' }).expect(401);
      const unknown = await post(ROOT, '/auth/login', { email: `${unique('ghost')}@example.test`, password: 'x' }).expect(401);
      expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(unknown.body.error).toMatchObject({ code: wrong.body.error.code, message: wrong.body.error.message });
    });

    it('locks an account after repeated failures, including for the right password', async () => {
      const user = await createUser(t.db);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await post(ROOT, '/auth/login', { email: user.email, password: 'wrong-password' }).expect(401);
      }
      const locked = await post(ROOT, '/auth/login', { email: user.email, password: user.password }).expect(429);
      expect(locked.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('refuses disabled accounts and suspended schools', async () => {
      const disabled = await createUser(t.db);
      await t.db.user.update({ where: { id: disabled.id }, data: { status: 'disabled' } });
      const res = await post(ROOT, '/auth/login', { email: disabled.email, password: disabled.password }).expect(403);
      expect(res.body.error.code).toBe('ACCOUNT_DISABLED');

      const suspended = await createSchool(t.db, { status: 'suspended' });
      const owner = await createUser(t.db);
      await addMember(t.db, suspended, owner, ['school_owner']);
      const blocked = await post(suspended.host, '/auth/login', { email: owner.email, password: owner.password }).expect(403);
      expect(blocked.body.error.code).toBe('SCHOOL_SUSPENDED');
    });

    it('replaces an existing session when signing in again', async () => {
      const user = await createUser(t.db);
      const first = await login(t.http, ROOT, user);
      const res = await request(t.http)
        .post('/api/v1/auth/login')
        .set('Host', ROOT)
        .set('Cookie', first)
        .send({ email: user.email, password: user.password })
        .expect(200);
      await request(t.http).get('/api/v1/auth/session').set('Host', ROOT).set('Cookie', first).expect(401);
      await request(t.http).get('/api/v1/auth/session').set('Host', ROOT).set('Cookie', sessionCookie(res)).expect(200);
    });
  });

  describe('sessions', () => {
    it('signs out, revoking the session server-side', async () => {
      const member = await createUser(t.db);
      await addMember(t.db, school, member, ['teacher']);
      const cookie = await login(t.http, school.host, member);

      const session = await request(t.http).get('/api/v1/auth/session').set('Host', school.host).set('Cookie', cookie).expect(200);
      expect(session.body.data.tenant.school.id).toBe(school.id);

      const res = await request(t.http).post('/api/v1/auth/logout').set('Host', school.host).set('Cookie', cookie).expect(204);
      expect((res.headers['set-cookie'] as unknown as string[])[0]).toMatch(/sc_session=;/);
      await request(t.http).get('/api/v1/auth/session').set('Host', school.host).set('Cookie', cookie).expect(401);

      // Signing out without a session still succeeds.
      await request(t.http).post('/api/v1/auth/logout').set('Host', ROOT).expect(204);
    });

    it('expires idle sessions', async () => {
      const user = await createUser(t.db);
      const cookie = await login(t.http, ROOT, user);
      await t.db.session.updateMany({
        where: { userId: user.id },
        data: { lastSeenAt: new Date(Date.now() - t.config.session.idleTimeoutMs - 1_000) },
      });
      await request(t.http).get('/api/v1/auth/session').set('Host', ROOT).set('Cookie', cookie).expect(401);
    });
  });

  describe('password reset', () => {
    it('resets the password once, signs out everywhere and keeps the reset host', async () => {
      const user = await createUser(t.db);
      await addMember(t.db, school, user, ['teacher']);
      const oldSession = await login(t.http, school.host, user);

      const unknown = await post(school.host, '/auth/password/forgot', { email: `${unique('ghost')}@example.test` }).expect(202);
      const known = await post(school.host, '/auth/password/forgot', { email: user.email }).expect(202);
      expect(known.body).toEqual(unknown.body);

      const mail = await t.mail.waitFor((message) => message.to === user.email && message.template === 'passwordReset');
      expect(mail.text).toContain(`http://${school.host}:3100/reset-password?token=`);
      const token = tokenFrom(mail, 'reset-password');

      await post(school.host, '/auth/password/reset', { token, password: 'brand-new-password-1' }).expect(200);
      const again = await post(school.host, '/auth/password/reset', { token, password: 'another-new-password' }).expect(400);
      expect(again.body.error.code).toBe('TOKEN_INVALID');

      await request(t.http).get('/api/v1/auth/session').set('Host', school.host).set('Cookie', oldSession).expect(401);
      await post(school.host, '/auth/login', { email: user.email, password: user.password }).expect(401);
      await login(t.http, school.host, { email: user.email, password: 'brand-new-password-1' });
    });
  });

  describe('request integrity', () => {
    it('rejects cross-site state-changing requests', async () => {
      const user = await createUser(t.db);
      const cross = await request(t.http)
        .post('/api/v1/auth/login')
        .set('Host', ROOT)
        .set('Origin', 'http://evil.localhost:3100')
        .send({ email: user.email, password: user.password })
        .expect(403);
      expect(cross.body.error.code).toBe('CSRF_REJECTED');

      await request(t.http)
        .post('/api/v1/auth/login')
        .set('Host', ROOT)
        .set('Sec-Fetch-Site', 'same-site')
        .send({ email: user.email, password: user.password })
        .expect(403);

      await request(t.http)
        .post('/api/v1/auth/login')
        .set('Host', `${school.slug}.localhost:3100`)
        .set('Origin', `http://${school.slug}.localhost:3100`)
        .set('Sec-Fetch-Site', 'same-origin')
        .send({ email: user.email, password: user.password })
        .expect(403) // valid request, but the user is not a member of this school
        .expect((res) => expect(res.body.error.code).toBe('TENANT_ACCESS_DENIED'));
    });

    it('rejects unknown hosts and unknown schools', async () => {
      const ip = await request(t.http).get('/api/v1/tenant').set('Host', '127.0.0.1').expect(404);
      expect(ip.body.error.code).toBe('HOST_NOT_RECOGNIZED');
      const missing = await request(t.http).get('/api/v1/tenant').set('Host', 'no-such-school.localhost').expect(404);
      expect(missing.body.error.code).toBe('SCHOOL_NOT_FOUND');
      const known = await request(t.http).get('/api/v1/tenant').set('Host', school.host).expect(200);
      expect(known.body.data).toEqual({
        host: 'school',
        school: { id: school.id, slug: school.slug, name: school.name, defaultLocale: 'en' },
      });
    });

    it('serves health checks on any host and tags responses with a request id', async () => {
      const res = await request(t.http).get('/api/v1/health').set('Host', '10.0.0.5').expect(200);
      expect(res.body.data).toEqual({ status: 'ok', checks: { database: 'up', systemDatabase: 'up', redis: 'up' } });
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });
  });
});
