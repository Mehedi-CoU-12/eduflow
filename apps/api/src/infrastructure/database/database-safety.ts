import type { PrismaClient } from './prisma.js';

interface RoleRow {
  role: string;
  is_superuser: boolean;
  bypasses_rls: boolean;
  owned_tables: number;
  unprotected_tables: string[] | null;
}

/**
 * Refuses to run normal requests over a connection that would silently bypass row
 * level security: a superuser, a BYPASSRLS role, or the owner of the tables (owners
 * are exempt from RLS). Also fails if any table with a `school_id` column lacks RLS.
 */
export async function assertRowLevelSecurityEnforced(client: PrismaClient): Promise<void> {
  const [row] = await client.$queryRaw<RoleRow[]>`
    SELECT
      r.rolname AS role,
      r.rolsuper AS is_superuser,
      r.rolbypassrls AS bypasses_rls,
      (
        SELECT count(*)::int FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relowner = r.oid
      ) AS owned_tables,
      (
        SELECT array_agg(c.relname::text ORDER BY c.relname) FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'school_id' AND NOT a.attisdropped
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
      ) AS unprotected_tables
    FROM pg_roles r
    WHERE r.rolname = current_user`;

  if (!row) throw new Error('Could not inspect the database role used by the API');

  const problems: string[] = [];
  if (row.is_superuser) problems.push(`role "${row.role}" is a superuser`);
  if (row.bypasses_rls) problems.push(`role "${row.role}" has BYPASSRLS`);
  if (row.owned_tables > 0) problems.push(`role "${row.role}" owns ${row.owned_tables} tables`);
  if (row.unprotected_tables?.length) {
    problems.push(`row level security is disabled on: ${row.unprotected_tables.join(', ')}`);
  }
  if (problems.length > 0) {
    throw new Error(
      `Refusing to start: DATABASE_URL must use a role that is subject to row level security (${problems.join('; ')}). ` +
        'See docs/multi-tenancy.md.',
    );
  }
}

/** The system role must not be a superuser or table owner either. */
export async function assertSystemRoleIsNotOwner(client: PrismaClient): Promise<void> {
  const [row] = await client.$queryRaw<Pick<RoleRow, 'role' | 'is_superuser' | 'owned_tables'>[]>`
    SELECT r.rolname AS role, r.rolsuper AS is_superuser,
      (
        SELECT count(*)::int FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relowner = r.oid
      ) AS owned_tables
    FROM pg_roles r WHERE r.rolname = current_user`;
  if (!row) throw new Error('Could not inspect the system database role');
  if (row.is_superuser || row.owned_tables > 0) {
    throw new Error(
      `Refusing to start: SYSTEM_DATABASE_URL must not use a superuser or the schema owner (got "${row.role}").`,
    );
  }
}
