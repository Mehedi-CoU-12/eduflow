import { Reflector } from '@nestjs/core';
import type { PlatformPermissionKey, SchoolPermissionKey } from '@eduflow/types';

/**
 * Every route declares exactly one access policy. Routes without one are rejected at
 * startup (RoutePolicyCheck) and denied at runtime (AccessGuard), so forgetting to
 * protect an endpoint fails closed.
 */
export type AccessPolicy =
  | { readonly kind: 'public'; readonly anyHost: boolean }
  | { readonly kind: 'authenticated' }
  | { readonly kind: 'tenant'; readonly permissions: readonly SchoolPermissionKey[] }
  | { readonly kind: 'platform'; readonly permissions: readonly PlatformPermissionKey[] };

export const Access = Reflector.createDecorator<AccessPolicy>();

/**
 * No session required. The host must still be a recognised EduFlow host unless
 * `anyHost` is set (health checks hit the API by IP).
 */
export const Public = (options: { anyHost?: boolean } = {}) =>
  Access({ kind: 'public', anyHost: options.anyHost ?? false });

/** A signed-in user; no school context needed (account-level endpoints). */
export const Authenticated = () => Access({ kind: 'authenticated' });

/** Any active member of the school resolved for this request. */
export const TenantMember = () => Access({ kind: 'tenant', permissions: [] });

/** An active member of the resolved school holding every listed permission. */
export const RequirePermissions = (...permissions: [SchoolPermissionKey, ...SchoolPermissionKey[]]) =>
  Access({ kind: 'tenant', permissions });

/** Platform staff on the platform host holding every listed platform permission. */
export const RequirePlatformPermissions = (
  ...permissions: [PlatformPermissionKey, ...PlatformPermissionKey[]]
) => Access({ kind: 'platform', permissions });
