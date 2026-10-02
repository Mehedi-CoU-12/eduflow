import type { Locale, OnboardingStatus, RoleSummaryDto, SchoolPermissionKey, SchoolStatus } from '@shikkhacore/types';

import type { TenantScope } from '../../infrastructure/database/app-database.js';
import type { PermissionSet } from '../access-control/permission-set.js';

export interface TenantSchool {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: SchoolStatus;
  readonly countryCode: string;
  readonly timezone: string;
  readonly currencyCode: string;
  readonly defaultLocale: Locale;
  readonly onboardingStatus: OnboardingStatus;
  readonly createdAt: Date;
}

/**
 * The verified school context of a request: which school, which member, and what they
 * may do. Only TenantResolverService creates these, after checking that the signed-in
 * user holds an active membership in a school resolved from the host or session —
 * never from a school id sent by the client.
 *
 * Pass it to services, which hand it to AppDatabase.withTenant().
 */
export class TenantContext implements TenantScope {
  /** Makes the type nominal: a plain `{ schoolId, userId }` object is not a TenantContext. */
  private declare readonly brand: 'TenantContext';

  private constructor(
    readonly schoolId: string,
    readonly userId: string,
    readonly membershipId: string,
    readonly school: TenantSchool,
    readonly roles: readonly RoleSummaryDto[],
    readonly permissions: PermissionSet<SchoolPermissionKey>,
  ) {}

  /** @internal Used by TenantResolverService only. */
  static verified(input: {
    userId: string;
    membershipId: string;
    school: TenantSchool;
    roles: readonly RoleSummaryDto[];
    permissions: PermissionSet<SchoolPermissionKey>;
  }): TenantContext {
    return new TenantContext(
      input.school.id,
      input.userId,
      input.membershipId,
      input.school,
      input.roles,
      input.permissions,
    );
  }
}
