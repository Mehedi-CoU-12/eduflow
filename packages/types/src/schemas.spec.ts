import { describe, expect, it } from '@jest/globals';

import { loginSchema, signupSchema } from './auth/schemas.js';
import { updateMemberRolesSchema } from './members/schemas.js';
import { isValidCurrencyCode, isValidTimeZone } from './schools/reference-data.js';
import { createSchoolSchema } from './schools/schemas.js';
import { isValidSchoolSlug, slugifySchoolName } from './schools/slug.js';

describe('auth schemas', () => {
  it('normalises emails to lowercase without surrounding whitespace', () => {
    const parsed = loginSchema.parse({ email: '  Admin@Greenfield.TEST ', password: 'x' });
    expect(parsed.email).toBe('admin@greenfield.test');
  });

  it('enforces the password length policy on signup', () => {
    const base = { name: 'Rahim', email: 'rahim@example.com' };
    expect(signupSchema.safeParse({ ...base, password: 'short' }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: 'long-enough-password' }).success).toBe(true);
  });
});

describe('school slugs', () => {
  it('accepts DNS-safe slugs and rejects reserved or malformed ones', () => {
    expect(isValidSchoolSlug('greenfield')).toBe(true);
    expect(isValidSchoolSlug('dhaka-model-school')).toBe(true);
    expect(isValidSchoolSlug('ab')).toBe(false);
    expect(isValidSchoolSlug('-greenfield')).toBe(false);
    expect(isValidSchoolSlug('green--field')).toBe(false);
    expect(isValidSchoolSlug('Greenfield')).toBe(false);
    expect(isValidSchoolSlug('admin')).toBe(false);
  });

  it('suggests slugs from names', () => {
    expect(slugifySchoolName('Greenfield International School')).toBe('greenfield-international-school');
    expect(slugifySchoolName('  St. Joseph’s  ')).toBe('st-joseph-s');
  });
});

describe('createSchoolSchema', () => {
  const valid = {
    name: 'Greenfield School',
    slug: 'Greenfield',
    countryCode: 'bd',
    timezone: 'Asia/Dhaka',
    currencyCode: 'bdt',
    defaultLocale: 'bn',
  };

  it('normalises case-insensitive fields', () => {
    expect(createSchoolSchema.parse(valid)).toMatchObject({
      slug: 'greenfield',
      countryCode: 'BD',
      currencyCode: 'BDT',
    });
  });

  it('rejects unknown time zones and currencies', () => {
    expect(createSchoolSchema.safeParse({ ...valid, timezone: 'Mars/Olympus' }).success).toBe(false);
    expect(createSchoolSchema.safeParse({ ...valid, currencyCode: 'XYZ' }).success).toBe(false);
  });

  it('validates reference data helpers', () => {
    expect(isValidTimeZone('Asia/Dhaka')).toBe(true);
    expect(isValidCurrencyCode('BDT')).toBe(true);
    expect(isValidCurrencyCode('bdt')).toBe(false);
  });
});

describe('updateMemberRolesSchema', () => {
  it('removes duplicate role ids', () => {
    const id = '0199a6d2-7c1e-7c3a-9b2f-1d2e3f4a5b6c';
    expect(updateMemberRolesSchema.parse({ roleIds: [id, id] }).roleIds).toEqual([id]);
  });
});
