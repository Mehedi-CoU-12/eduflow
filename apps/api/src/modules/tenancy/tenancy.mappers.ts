import {
  isLocale,
  type HostKind,
  type OnboardingStatus,
  type SchoolDto,
  type SchoolStatus,
  type TenantContextDto,
} from '@shikkhacore/types';

import type { AppConfig } from '../../config/env.js';
import { schoolUrl } from './school-urls.js';
import type { TenantContext } from './tenant-context.js';
import type { HostContext } from './tenancy.types.js';

export interface SchoolRow {
  id: string;
  slug: string;
  name: string;
  status: SchoolStatus;
  countryCode: string;
  timezone: string;
  currencyCode: string;
  defaultLocale: string;
  onboardingStatus: OnboardingStatus;
  createdAt: Date;
}

export const SCHOOL_SELECT = {
  id: true,
  slug: true,
  name: true,
  status: true,
  countryCode: true,
  timezone: true,
  currencyCode: true,
  defaultLocale: true,
  onboardingStatus: true,
  createdAt: true,
} as const;

export function toSchoolDto(config: AppConfig, school: SchoolRow): SchoolDto {
  return {
    id: school.id,
    slug: school.slug,
    name: school.name,
    status: school.status,
    url: schoolUrl(config, school.slug),
    countryCode: school.countryCode.trim(),
    timezone: school.timezone,
    currencyCode: school.currencyCode.trim(),
    defaultLocale: isLocale(school.defaultLocale) ? school.defaultLocale : 'en',
    onboardingStatus: school.onboardingStatus,
    createdAt: school.createdAt.toISOString(),
  };
}

export function toTenantContextDto(config: AppConfig, tenant: TenantContext): TenantContextDto {
  return {
    school: toSchoolDto(config, tenant.school),
    membership: { id: tenant.membershipId, status: 'active' },
    roles: [...tenant.roles],
    permissions: tenant.permissions.toArray(),
  };
}

export function hostKind(host: HostContext): HostKind {
  return host.kind === 'unknown' ? 'root' : host.kind;
}
