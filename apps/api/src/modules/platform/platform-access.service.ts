import { Injectable } from '@nestjs/common';
import { isPlatformPermissionKey, type PlatformPermissionKey } from '@eduflow/types';

import { SystemDatabase } from '../../infrastructure/database/system-database.js';
import { PermissionSet, type Grant } from '../access-control/permission-set.js';
import type { PlatformContext } from './platform.types.js';

/** Resolves platform staff membership. Platform access never derives from a school role. */
@Injectable()
export class PlatformAccessService {
  constructor(private readonly system: SystemDatabase) {}

  async find(userId: string): Promise<PlatformContext | null> {
    const membership = await this.system.client.platformMembership.findUnique({
      where: { userId },
      select: {
        status: true,
        role: {
          select: {
            id: true,
            key: true,
            name: true,
            grants: { select: { permissionKey: true, scope: true } },
          },
        },
      },
    });
    if (!membership || membership.status !== 'active') return null;

    const { role } = membership;
    const grants: Grant<PlatformPermissionKey>[] = role.grants.flatMap((grant) =>
      isPlatformPermissionKey(grant.permissionKey) ? [{ key: grant.permissionKey, scope: grant.scope }] : [],
    );
    return {
      userId,
      roles: [{ id: role.id, key: role.key, name: role.name, isSystem: true }],
      permissions: PermissionSet.fromGrants(grants),
    };
  }
}
