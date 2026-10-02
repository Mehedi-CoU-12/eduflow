import type { PlatformPermissionKey, RoleSummaryDto } from '@shikkhacore/types';

import type { PermissionSet } from '../access-control/permission-set.js';

/** A verified platform staff member, available on platform-host routes. */
export interface PlatformContext {
  readonly userId: string;
  readonly roles: readonly RoleSummaryDto[];
  readonly permissions: PermissionSet<PlatformPermissionKey>;
}
