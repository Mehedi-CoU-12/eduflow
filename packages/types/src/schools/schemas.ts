import { z } from 'zod';

import { localeSchema } from '../i18n/locales.js';
import { isValidCurrencyCode, isValidTimeZone } from './reference-data.js';
import { RESERVED_SLUGS, SCHOOL_SLUG_PATTERN } from './slug.js';

export const SCHOOL_STATUSES = ['active', 'suspended', 'archived'] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export const ONBOARDING_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const schoolSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(SCHOOL_SLUG_PATTERN, {
    error: 'Use 3–40 lowercase letters, numbers and single hyphens',
  })
  .refine((slug) => !RESERVED_SLUGS.has(slug), { error: 'This address is reserved' });

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, { error: 'Use an ISO 3166-1 alpha-2 country code' });

export const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine(isValidTimeZone, { error: 'Unknown time zone' });

export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidCurrencyCode, { error: 'Unknown currency code' });

export const createSchoolSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: schoolSlugSchema,
  countryCode: countryCodeSchema,
  timezone: timeZoneSchema,
  currencyCode: currencyCodeSchema,
  defaultLocale: localeSchema,
});
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
