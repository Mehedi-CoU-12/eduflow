import { Injectable } from '@nestjs/common';
import { isLocale, isSchoolPermissionKey, type RoleSummaryDto, type SchoolPermissionKey } from '@eduflow/types';

import { AppError } from '../../common/errors/app-error.js';
import { AppDatabase } from '../../infrastructure/database/app-database.js';
import { PermissionSet, type Grant } from '../access-control/permission-set.js';
import type { AuthContext } from '../auth/auth.types.js';
import { TenantContext } from './tenant-context.js';
import type { HostContext } from './tenancy.types.js';

/**
 * TenantResolver, step 2: decides which school a signed-in request acts on and proves
 * the user belongs to it.
 *
 *   school host   -> the school the hostname resolved to
 *   account host  -> the school selected in the session (PUT /auth/session/school)
 *   platform host -> never a school: platform and school contexts stay separate
 *
 * A school id from the request body, query or headers is never used here.
 */
@Injectable()
export class TenantResolverService {
  constructor(private readonly db: AppDatabase) {}

  async resolve(host: HostContext, auth: AuthContext): Promise<TenantContext> {
    const tenant = await this.load(this.schoolIdFor(host, auth), auth.userId);
    if (!tenant) throw AppError.forbidden('TENANT_ACCESS_DENIED', 'You are not a member of this school');
    return tenant;
  }

  /**
   * Loads the user's active membership in `schoolId`, with roles and merged permissions,
   * inside that school's RLS context. Returns null when there is no active membership.
   */
  async load(schoolId: string, userId: string): Promise<TenantContext | null> {
    const membership = await this.db.withTenant({ schoolId, userId }, (tx) =>
      tx.db.schoolMembership.findUnique({
        where: { schoolId_userId: { schoolId, userId } },
        select: {
          id: true,
          status: true,
          school: {
            select: {
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
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                  schoolId: true,
                  grants: { select: { permissionKey: true, scope: true } },
                },
              },
            },
          },
        },
      }),
    );

    if (!membership || membership.status !== 'active') return null;
    if (membership.school.status !== 'active') {
      throw AppError.forbidden('SCHOOL_SUSPENDED', 'This school is not active');
    }

    const roles: RoleSummaryDto[] = membership.roles.map(({ role }) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      isSystem: role.schoolId === null,
    }));
    const grants: Grant<SchoolPermissionKey>[] = membership.roles.flatMap(({ role }) =>
      role.grants.flatMap((grant) =>
        isSchoolPermissionKey(grant.permissionKey) ? [{ key: grant.permissionKey, scope: grant.scope }] : [],
      ),
    );

    const { school } = membership;
    return TenantContext.verified({
      userId,
      membershipId: membership.id,
      school: {
        ...school,
        countryCode: school.countryCode.trim(),
        currencyCode: school.currencyCode.trim(),
        defaultLocale: isLocale(school.defaultLocale) ? school.defaultLocale : 'en',
      },
      roles,
      permissions: PermissionSet.fromGrants(grants),
    });
  }

  private schoolIdFor(host: HostContext, auth: AuthContext): string {
    switch (host.kind) {
      case 'school':
        return host.school.id;
      case 'root':
        if (auth.activeSchoolId) return auth.activeSchoolId;
        throw AppError.badRequest('TENANT_REQUIRED', 'Select a school to continue');
      case 'platform':
        throw AppError.badRequest('TENANT_REQUIRED', 'School features are not available on the platform host');
      case 'unknown':
        throw AppError.notFound('HOST_NOT_RECOGNIZED', 'This address is not a EduFlow site');
    }
  }
}
