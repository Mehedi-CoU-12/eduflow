import { PERMISSIONS, PERMISSION_KEYS, SYSTEM_ROLES, SYSTEM_ROLE_KEYS, type PermissionKey } from '@shikkhacore/types';

import type { PrismaClient } from '../../infrastructure/database/prisma.js';

export interface SyncSummary {
  permissions: number;
  roles: number;
  grantsAdded: number;
}

/**
 * Brings the `permissions`, system `roles` and their `role_permissions` in line with the
 * catalog in @shikkhacore/types. Additive only: it inserts and updates, never deletes,
 * so instances running an older release during a rolling deploy cannot revoke access.
 * Removing a permission or a system-role grant requires an explicit migration.
 *
 * Plain function (no Nest DI) so the seed script can call it too. Must run with the
 * system database client.
 */
export async function syncAccessControl(db: PrismaClient): Promise<SyncSummary> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('shikkhacore:access-control-sync'))`;

      for (const key of PERMISSION_KEYS) {
        const definition = PERMISSIONS[key];
        await tx.permission.upsert({
          where: { key },
          create: {
            key,
            realm: definition.realm,
            module: definition.module,
            description: definition.description,
            scopes: [...definition.scopes],
          },
          update: { module: definition.module, description: definition.description, scopes: [...definition.scopes] },
          select: { key: true },
        });
      }

      let grantsAdded = 0;
      for (const key of SYSTEM_ROLE_KEYS) {
        const definition = SYSTEM_ROLES[key];
        const role = await tx.role.upsert({
          where: { key },
          create: { key, realm: definition.realm, name: definition.name, description: definition.description },
          update: { name: definition.name, description: definition.description },
          select: { id: true, realm: true },
        });
        if (role.realm !== definition.realm) {
          throw new Error(`System role "${key}" exists with realm "${role.realm}", expected "${definition.realm}"`);
        }
        const grants = Object.entries(definition.grants) as [PermissionKey, (typeof definition.grants)[PermissionKey]][];
        const result = await tx.rolePermission.createMany({
          data: grants.flatMap(([permissionKey, scope]) => (scope ? [{ roleId: role.id, permissionKey, scope }] : [])),
          skipDuplicates: true,
        });
        grantsAdded += result.count;
      }

      return { permissions: PERMISSION_KEYS.length, roles: SYSTEM_ROLE_KEYS.length, grantsAdded };
    },
    { timeout: 30_000 },
  );
}
