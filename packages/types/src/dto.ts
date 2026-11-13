/**
 * Response shapes returned inside `data` by the EduFlow API.
 * Dates are ISO 8601 strings.
 */
import type {
  AcademicYearStatus,
  SubjectType,
  TermStatus,
} from './academics/schemas.js';
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
  user: Pick<UserDto, 'id' | 'name' | 'email' | 'avatarUrl' | 'emailVerified'>;
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

export interface AuditLogDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: { id: string; name: string; email: string } | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PlatformUserDto extends UserDto {
  status: string;
  schoolCount: number;
  createdAt: string;
}

export interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  termCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TermDto {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDto {
  id: string;
  classId: string;
  name: string;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassDto {
  id: string;
  name: string;
  code: string;
  sectionCount?: number;
  sections?: SectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
  type: SubjectType;
  creditHours: number | null;
  createdAt: string;
  updatedAt: string;
}
