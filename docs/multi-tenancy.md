# Multi-Tenancy Architecture in EduFlow

EduFlow is designed from the ground up for strict multi-tenant isolation, defense-in-depth, and operational safety.

## Core Tenancy Model

1. **Shared Database, Shared Schema with Row Level Security (RLS)**:
   - All tenants share the same PostgreSQL database and schema.
   - Every tenant-owned row includes a `school_id` foreign key.
   - PostgreSQL Row Level Security (RLS) ensures that tenant data is never leaked, even if application code inadvertently forgets to include a `WHERE school_id = ...` filter.

2. **Three-Tier Database Roles**:
   - `eduflow_owner`:
     - Schema owner used strictly for executing migrations (`prisma migrate dev` / `prisma migrate deploy`).
     - Never used by the running API application.
   - `eduflow_app`:
     - Role used for normal API requests.
     - Subject to Row Level Security (`NOBYPASSRLS`).
     - Uses connection pooling. RLS context is set explicitly inside a transaction using `set_config('app.school_id', ..., true)` and `set_config('app.user_id', ..., true)`.
     - Transaction-scoped configuration (`is_local = true`) ensures context is cleared automatically when the transaction completes, preventing state leakage across pooled connections.
   - `eduflow_system`:
     - Used exclusively for narrow, trusted operations: authentication, password resets, domain/tenant resolution, platform administration, and database seeding.
     - Granted explicit `system_access` RLS policies (`USING (true) WITH CHECK (true)`), rather than `BYPASSRLS`, allowing it to operate securely on managed database services (e.g. AWS RDS, GCP Cloud SQL, Supabase, Neon).

## Request Isolation Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant TenantResolver
    participant Guard
    participant AppDatabase
    participant PostgresRLS

    Client->>TenantResolver: Request with Host header (e.g. greenfield.localhost)
    TenantResolver->>TenantResolver: Resolve school from slug / domain
    Client->>Guard: Authenticate session cookie
    Guard->>Guard: Verify membership in resolved school
    Guard->>AppDatabase: db.withTenant({ schoolId, userId }, callback)
    AppDatabase->>PostgresRLS: BEGIN; SET LOCAL app.school_id = '...'; SET LOCAL app.user_id = '...'
    AppDatabase->>PostgresRLS: Execute query via eduflow_app
    PostgresRLS-->>AppDatabase: Return tenant-filtered results
    AppDatabase->>PostgresRLS: COMMIT
    AppDatabase-->>Client: Filtered Response
```

## Fail-Closed Design

- The helper functions `app.current_school_id()` and `app.current_user_id()` return `NULL` if the session settings are unset or empty.
- Because `school_id = NULL` evaluates to `NULL` in SQL (which fails boolean evaluation), uninitialized or missing context fails closed by returning zero rows.
- Table modifications are checked with `WITH CHECK (school_id = (SELECT app.current_school_id()))`, preventing unauthorized cross-tenant writes.

## Host Resolution Modes

EduFlow distinguishes three host contexts:

1. **Root Host (`APP_ROOT_HOSTS`, e.g. `localhost`)**:
   - Central portal for user sign-up, sign-in, account settings, school creation, and selecting active schools (`/me/schools`).
2. **School Host (`<slug>.<APP_BASE_DOMAIN>` or verified custom domains)**:
   - Dedicated tenant context for students, guardians, teachers, and school administrators.
   - Resolves the school entity automatically and confines all queries to that tenant.
3. **Platform Host (`APP_PLATFORM_HOSTS`, e.g. `admin.localhost`)**:
   - Platform administration portal for global operators (`platform_owner`).
   - Access to platform overview, school lifecycle management, and global user auditing.
