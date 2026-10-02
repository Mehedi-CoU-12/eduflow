/**
 * Response shapes returned inside `data` by the ShikkhaCore API.
 * Dates are ISO 8601 strings.
 */
import type {
  PermissionKey,
  PermissionScope,
  PlatformPermissionKey,
  Realm,
  SchoolPermissionKey,
} from './access-control/permissions.js';
import type { Locale } from './i18n/locales.js';
import type { MembershipStatus } from './members/schemas.js';
import type { OnboardingStatus, SchoolStatus } from './schools/schemas.js';

export type HostKind = 'root' | 'school' | 'platform';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  locale: Locale | null;
  emailVerified: boolean;
}

export interface SchoolSummaryDto {
  id: string;
  slug: string;
  name: string;
  status: SchoolStatus;
  /** Public URL of the school's own subdomain. */
  url: string;
}

export interface SchoolDto extends SchoolSummaryDto {
  countryCode: string;
  timezone: string;
  currencyCode: string;
  defaultLocale: Locale;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
}

/** Public, unauthenticated view of the school a host belongs to (used for branding). */
export interface PublicTenantDto {
  host: HostKind;
  school: Pick<SchoolDto, 'id' | 'slug' | 'name' | 'defaultLocale'> | null;
}

export interface RoleSummaryDto {
  id: string;
  /** Stable key for system roles (`teacher`); null for custom roles. */
  key: string | null;
  name: string;
  isSystem: boolean;
}

export interface PermissionGrantDto<K extends PermissionKey = PermissionKey> {
  key: K;
  scope: PermissionScope;
}

export interface RoleDto extends RoleSummaryDto {
  description: string | null;
  grants: PermissionGrantDto<SchoolPermissionKey>[];
}

export interface PermissionDto {
  key: PermissionKey;
  realm: Realm;
  module: string;
  description: string;
  scopes: PermissionScope[];
}

export interface TenantContextDto {
  school: SchoolDto;
  membership: { id: string; status: MembershipStatus };
  roles: RoleSummaryDto[];
  permissions: PermissionGrantDto<SchoolPermissionKey>[];
}

export interface PlatformContextDto {
  roles: RoleSummaryDto[];
  permissions: PlatformPermissionKey[];
}

export interface SessionContextDto {
  user: UserDto;
  host: HostKind;
  session: { id: string; expiresAt: string };
  /** Present when the request resolves to a school the user is an active member of. */
  tenant: TenantContextDto | null;
  /** Present on the platform host for platform staff. */
  platform: PlatformContextDto | null;
}

export interface MyMembershipDto {
  membershipId: string;
  status: MembershipStatus;
  school: SchoolSummaryDto;
  roles: RoleSummaryDto[];
}

export interface MemberDto {
  id: string;
  status: MembershipStatus;
  user: Pick<UserDto, 'id' | 'name' | 'email' | 'avatarUrl'>;
  roles: RoleSummaryDto[];
  createdAt: string;
}

export interface PlatformSchoolDto extends SchoolSummaryDto {
  countryCode: string;
  memberCount: number;
  createdAt: string;
}

export interface PlatformOverviewDto {
  schools: { total: number; active: number; suspended: number };
  users: { total: number };
}

export interface HealthDto {
  status: 'ok' | 'degraded';
  checks: Record<string, 'up' | 'down'>;
}
