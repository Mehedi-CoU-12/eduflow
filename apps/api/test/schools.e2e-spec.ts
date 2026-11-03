import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { createUser, login, unique } from './support/fixtures.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const ROOT = 'localhost';

describe('school creation (onboarding step 1)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(() => t.close());

  const input = (slug: string) => ({
    name: 'Dhaka Model School',
    slug,
    countryCode: 'BD',
    timezone: 'Asia/Dhaka',
    currencyCode: 'BDT',
    defaultLocale: 'bn',
  });

  it('creates a school owned by the caller and selects it for the session', async () => {
    const user = await createUser(t.db);
    const cookie = await login(t.http, ROOT, user);
    const slug = unique('dhaka');

    const res = await request(t.http)
      .post('/api/v1/schools')
      .set('Host', ROOT)
      .set('Cookie', cookie)
      .send(input(slug))
      .expect(201);
    expect(res.body.data).toMatchObject({
      slug,
      status: 'active',
      url: `http://${slug}.localhost:3100`,
      countryCode: 'BD',
      currencyCode: 'BDT',
      defaultLocale: 'bn',
      onboardingStatus: 'in_progress',
    });

    const session = await request(t.http).get('/api/v1/auth/session').set('Host', ROOT).set('Cookie', cookie).expect(200);
    const tenantData = session.body.data as { tenant: { school: { slug: string }; roles: { key: string }[] } };
    expect(tenantData.tenant.school.slug).toBe(slug);
    expect(tenantData.tenant.roles.map((role) => role.key)).toEqual(['school_owner']);

    // The new school's own subdomain resolves immediately, and the owner can sign in there.
    await request(t.http).get('/api/v1/tenant').set('Host', `${slug}.localhost`).expect(200);
    await login(t.http, `${slug}.localhost`, user);

    const audit = await t.db.auditLog.findFirst({ where: { schoolId: res.body.data.id, action: 'school.created' } });
    expect(audit?.actorUserId).toBe(user.id);
  });

  it('rejects taken, reserved and malformed addresses', async () => {
    const user = await createUser(t.db);
    const cookie = await login(t.http, ROOT, user);
    const create = (body: object) =>
      request(t.http).post('/api/v1/schools').set('Host', ROOT).set('Cookie', cookie).send(body);

    const slug = unique('taken');
    await create(input(slug)).expect(201);
    const taken = await create(input(slug)).expect(409);
    expect(taken.body.error.code).toBe('SLUG_TAKEN');

    await create(input('admin')).expect(400);
    await create(input('Not A Slug!')).expect(400);
    await create({ ...input(unique('tz')), timezone: 'Mars/Olympus' }).expect(400);
  });

  it('requires a signed-in user on the account host', async () => {
    await request(t.http).post('/api/v1/schools').set('Host', ROOT).send(input(unique('anon'))).expect(401);
  });
});
