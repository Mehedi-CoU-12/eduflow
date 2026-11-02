-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('email_verification', 'password_reset');

-- CreateEnum
CREATE TYPE "Realm" AS ENUM ('school', 'platform');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('own', 'assigned', 'all');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('active', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('invited', 'active', 'suspended', 'removed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "locale" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "email_verified_at" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "active_school_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_reason" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "key" TEXT NOT NULL,
    "realm" "Realm" NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scopes" "PermissionScope"[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID,
    "realm" "Realm" NOT NULL,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_key" TEXT NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'all',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_key")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'active',
    "country_code" CHAR(2) NOT NULL DEFAULT 'BD',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "currency_code" CHAR(3) NOT NULL DEFAULT 'BDT',
    "default_locale" TEXT NOT NULL DEFAULT 'en',
    "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'not_started',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_domains" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "membership_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("membership_id","role_id")
);

-- CreateTable
CREATE TABLE "platform_memberships" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_memberships_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "school_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE INDEX "roles_school_id_idx" ON "roles"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_school_id_name_key" ON "roles"("school_id", "name");

-- CreateIndex
CREATE INDEX "role_permissions_permission_key_idx" ON "role_permissions"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "school_domains_domain_key" ON "school_domains"("domain");

-- CreateIndex
CREATE INDEX "school_domains_school_id_idx" ON "school_domains"("school_id");

-- CreateIndex
CREATE INDEX "school_memberships_user_id_idx" ON "school_memberships"("user_id");

-- CreateIndex
CREATE INDEX "school_memberships_school_id_status_idx" ON "school_memberships"("school_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_school_id_user_id_key" ON "school_memberships"("school_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_id_school_id_key" ON "school_memberships"("id", "school_id");

-- CreateIndex
CREATE INDEX "membership_roles_school_id_idx" ON "membership_roles"("school_id");

-- CreateIndex
CREATE INDEX "membership_roles_role_id_idx" ON "membership_roles"("role_id");

-- CreateIndex
CREATE INDEX "platform_memberships_role_id_idx" ON "platform_memberships"("role_id");

-- CreateIndex
CREATE INDEX "audit_logs_school_id_created_at_idx" ON "audit_logs"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_school_id_entity_type_entity_id_idx" ON "audit_logs"("school_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_school_id_fkey" FOREIGN KEY ("active_school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "permissions"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_domains" ADD CONSTRAINT "school_domains_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_id_school_id_fkey" FOREIGN KEY ("membership_id", "school_id") REFERENCES "school_memberships"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_memberships" ADD CONSTRAINT "platform_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_memberships" ADD CONSTRAINT "platform_memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- Hand-written below this line: tenant isolation, privileges and integrity rules.
-- Prisma does not model any of this. See docs/multi-tenancy.md and docs/database.md.
--
-- Database roles (created by infra/postgres/sql/001_roles.sql):
--   eduflow_owner   owns every object, runs migrations, never used by the API
--   eduflow_app     normal API requests; row level security applies
--   eduflow_system  trusted code paths; full access through explicit policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Request context helpers
-- -----------------------------------------------------------------------------

CREATE SCHEMA app;
GRANT USAGE ON SCHEMA app TO eduflow_app, eduflow_system;

-- The API sets these per transaction with set_config('app.school_id', ..., true), so a
-- pooled connection never carries one request's context into the next. Unset or empty
-- settings yield NULL, which matches no rows: missing context fails closed.
CREATE FUNCTION app.current_school_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT NULLIF(current_setting('app.school_id', true), '')::uuid $$;

CREATE FUNCTION app.current_user_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;

REVOKE ALL ON FUNCTION app.current_school_id(), app.current_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.current_school_id(), app.current_user_id()
  TO eduflow_app, eduflow_system;

-- Standard isolation for a table with a NOT NULL school_id column. Every new
-- tenant-owned table should call this in its migration, then grant privileges:
--   SELECT app.enable_tenant_rls('students');
--   GRANT SELECT, INSERT, UPDATE ON students TO eduflow_app, eduflow_system;
CREATE FUNCTION app.enable_tenant_rls(p_table regclass) RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format(
    'CREATE POLICY tenant_isolation ON %s AS PERMISSIVE FOR ALL TO eduflow_app '
    'USING (school_id = (SELECT app.current_school_id())) '
    'WITH CHECK (school_id = (SELECT app.current_school_id()))',
    p_table);
  EXECUTE format(
    'CREATE POLICY system_access ON %s AS PERMISSIVE FOR ALL TO eduflow_system '
    'USING (true) WITH CHECK (true)',
    p_table);
END
$$;

REVOKE ALL ON FUNCTION app.enable_tenant_rls(regclass) FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- Identity tables
-- -----------------------------------------------------------------------------

-- users: global profiles. A user sees themself; inside a school context they also
-- see that school's members. Only the profile columns are writable, and only by the
-- user themself. Sign-up and invitations write through the system role.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_visible ON users FOR SELECT TO eduflow_app
  USING (
    id = (SELECT app.current_user_id())
    OR EXISTS (
      SELECT 1 FROM school_memberships m
      WHERE m.user_id = users.id
        AND m.school_id = (SELECT app.current_school_id())
    )
  );
CREATE POLICY users_update_self ON users FOR UPDATE TO eduflow_app
  USING (id = (SELECT app.current_user_id()))
  WITH CHECK (id = (SELECT app.current_user_id()));
CREATE POLICY system_access ON users FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT ON users TO eduflow_app;
GRANT UPDATE (name, phone, avatar_url, locale, updated_at) ON users TO eduflow_app;
GRANT SELECT, INSERT, UPDATE ON users TO eduflow_system;

-- Secrets and sessions: the app role has no privileges at all. RLS is enabled with a
-- system-only policy as a second barrier in case a grant is ever added by mistake.
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_access ON user_credentials FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON user_credentials TO eduflow_system;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_access ON sessions FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO eduflow_system;

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_access ON auth_tokens FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_tokens TO eduflow_system;

ALTER TABLE platform_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_access ON platform_memberships FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_memberships TO eduflow_system;

-- -----------------------------------------------------------------------------
-- Tenancy tables
-- -----------------------------------------------------------------------------

-- schools: inside a school context only that school is visible. With only a user
-- context (account host) the schools the user is an active member of are visible.
-- A new school is inserted inside a context set to its own (server-generated) id.
-- Schools are archived, never deleted.
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY schools_visible ON schools FOR SELECT TO eduflow_app
  USING (
    id = (SELECT app.current_school_id())
    OR (
      (SELECT app.current_school_id()) IS NULL
      AND id IN (
        SELECT m.school_id FROM school_memberships m
        WHERE m.user_id = (SELECT app.current_user_id()) AND m.status = 'active'
      )
    )
  );
CREATE POLICY schools_insert ON schools FOR INSERT TO eduflow_app
  WITH CHECK (id = (SELECT app.current_school_id()));
CREATE POLICY schools_update ON schools FOR UPDATE TO eduflow_app
  USING (id = (SELECT app.current_school_id()))
  WITH CHECK (id = (SELECT app.current_school_id()));
CREATE POLICY system_access ON schools FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON schools TO eduflow_app, eduflow_system;

SELECT app.enable_tenant_rls('school_domains');
GRANT SELECT, INSERT, UPDATE, DELETE ON school_domains TO eduflow_app, eduflow_system;

-- school_memberships: tenant isolation, plus a user's own memberships when no school
-- is selected (the school picker). Memberships are never deleted by the app.
SELECT app.enable_tenant_rls('school_memberships');
CREATE POLICY own_memberships ON school_memberships FOR SELECT TO eduflow_app
  USING (
    (SELECT app.current_school_id()) IS NULL
    AND user_id = (SELECT app.current_user_id())
  );
GRANT SELECT, INSERT, UPDATE ON school_memberships TO eduflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON school_memberships TO eduflow_system;

SELECT app.enable_tenant_rls('membership_roles');
CREATE POLICY own_membership_roles ON membership_roles FOR SELECT TO eduflow_app
  USING (
    (SELECT app.current_school_id()) IS NULL
    AND membership_id IN (
      SELECT m.id FROM school_memberships m WHERE m.user_id = (SELECT app.current_user_id())
    )
  );
GRANT SELECT, INSERT, DELETE ON membership_roles TO eduflow_app, eduflow_system;

-- -----------------------------------------------------------------------------
-- Access control tables
-- -----------------------------------------------------------------------------

-- permissions: global read-only catalog for the app role.
GRANT SELECT ON permissions TO eduflow_app;
GRANT SELECT, INSERT, UPDATE ON permissions TO eduflow_system;

-- roles: school-realm system roles are visible everywhere; custom roles only inside
-- their school (or, on the account host, to that school's active members). The app
-- role can create and change custom roles of the current school only.
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_visible ON roles FOR SELECT TO eduflow_app
  USING (
    (school_id IS NULL AND realm = 'school')
    OR school_id = (SELECT app.current_school_id())
    OR (
      (SELECT app.current_school_id()) IS NULL
      AND school_id IN (
        SELECT m.school_id FROM school_memberships m
        WHERE m.user_id = (SELECT app.current_user_id()) AND m.status = 'active'
      )
    )
  );
CREATE POLICY custom_roles_insert ON roles FOR INSERT TO eduflow_app
  WITH CHECK (school_id = (SELECT app.current_school_id()) AND realm = 'school');
CREATE POLICY custom_roles_update ON roles FOR UPDATE TO eduflow_app
  USING (school_id = (SELECT app.current_school_id()))
  WITH CHECK (school_id = (SELECT app.current_school_id()) AND realm = 'school');
CREATE POLICY custom_roles_delete ON roles FOR DELETE TO eduflow_app
  USING (school_id = (SELECT app.current_school_id()));
CREATE POLICY system_access ON roles FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO eduflow_app, eduflow_system;

-- role_permissions: visible when the role is visible (the subquery is itself filtered
-- by the roles policies); writable only for the current school's custom roles.
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY grants_visible ON role_permissions FOR SELECT TO eduflow_app
  USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id));
CREATE POLICY custom_grants_insert ON role_permissions FOR INSERT TO eduflow_app
  WITH CHECK (EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id = role_permissions.role_id AND r.school_id = (SELECT app.current_school_id())
  ));
CREATE POLICY custom_grants_update ON role_permissions FOR UPDATE TO eduflow_app
  USING (EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id = role_permissions.role_id AND r.school_id = (SELECT app.current_school_id())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id = role_permissions.role_id AND r.school_id = (SELECT app.current_school_id())
  ));
CREATE POLICY custom_grants_delete ON role_permissions FOR DELETE TO eduflow_app
  USING (EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id = role_permissions.role_id AND r.school_id = (SELECT app.current_school_id())
  ));
CREATE POLICY system_access ON role_permissions FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions TO eduflow_app, eduflow_system;

-- -----------------------------------------------------------------------------
-- Audit log: append-only for every role, including the owner
-- -----------------------------------------------------------------------------

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_audit_select ON audit_logs FOR SELECT TO eduflow_app
  USING (school_id = (SELECT app.current_school_id()));
-- The app role can only record events for the current school, as the current user.
CREATE POLICY tenant_audit_insert ON audit_logs FOR INSERT TO eduflow_app
  WITH CHECK (
    school_id = (SELECT app.current_school_id())
    AND actor_user_id IS NOT DISTINCT FROM (SELECT app.current_user_id())
  );
CREATE POLICY system_access ON audit_logs FOR ALL TO eduflow_system USING (true) WITH CHECK (true);
GRANT SELECT, INSERT ON audit_logs TO eduflow_app, eduflow_system;

CREATE FUNCTION app.reject_audit_log_change() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = 'insufficient_privilege';
END
$$;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION app.reject_audit_log_change();
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION app.reject_audit_log_change();

-- -----------------------------------------------------------------------------
-- CHECK constraints
-- -----------------------------------------------------------------------------

ALTER TABLE users
  ADD CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  ADD CONSTRAINT users_locale_format CHECK (locale IS NULL OR locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$');

ALTER TABLE schools
  ADD CONSTRAINT schools_slug_format
    CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' AND position('--' IN slug) = 0),
  ADD CONSTRAINT schools_country_code_format CHECK (country_code ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT schools_currency_code_format CHECK (currency_code ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT schools_default_locale_format CHECK (default_locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$');

ALTER TABLE school_domains
  ADD CONSTRAINT school_domains_domain_format
    CHECK (domain = lower(domain) AND domain ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$');

ALTER TABLE permissions
  ADD CONSTRAINT permissions_scopes_present CHECK (scopes IS NOT NULL AND cardinality(scopes) > 0);

-- System roles: global with a stable key. Custom roles: school-owned, no key.
ALTER TABLE roles
  ADD CONSTRAINT roles_system_or_custom CHECK ((school_id IS NULL) = (key IS NOT NULL)),
  ADD CONSTRAINT roles_platform_roles_are_global CHECK (realm = 'school' OR school_id IS NULL);

ALTER TABLE sessions
  ADD CONSTRAINT sessions_expiry_after_creation CHECK (expires_at > created_at);

ALTER TABLE auth_tokens
  ADD CONSTRAINT auth_tokens_expiry_after_creation CHECK (expires_at > created_at);

-- -----------------------------------------------------------------------------
-- Cross-table integrity triggers
-- These run with the caller's privileges, so under the app role they only see roles
-- visible through RLS; an invisible role is treated as invalid (fail closed).
-- -----------------------------------------------------------------------------

-- A grant's permission must belong to the role's realm and use an allowed scope.
CREATE FUNCTION app.check_role_permission() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
DECLARE
  v_role_realm public."Realm";
  v_permission_realm public."Realm";
  v_scopes public."PermissionScope"[];
BEGIN
  SELECT r.realm INTO v_role_realm FROM public.roles r WHERE r.id = NEW.role_id;
  SELECT p.realm, p.scopes INTO v_permission_realm, v_scopes
    FROM public.permissions p WHERE p.key = NEW.permission_key;

  IF v_role_realm IS NULL OR v_role_realm IS DISTINCT FROM v_permission_realm THEN
    RAISE EXCEPTION 'permission % cannot be granted to role %', NEW.permission_key, NEW.role_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (NEW.scope = ANY (v_scopes)) THEN
    RAISE EXCEPTION 'scope % is not allowed for permission %', NEW.scope, NEW.permission_key
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER role_permissions_integrity
  BEFORE INSERT OR UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION app.check_role_permission();

-- A membership can only hold school-realm roles that are global or its own school's.
CREATE FUNCTION app.check_membership_role() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
DECLARE
  v_role record;
BEGIN
  SELECT r.school_id, r.realm INTO v_role FROM public.roles r WHERE r.id = NEW.role_id;
  IF NOT FOUND
     OR v_role.realm <> 'school'
     OR (v_role.school_id IS NOT NULL AND v_role.school_id <> NEW.school_id) THEN
    RAISE EXCEPTION 'role % cannot be assigned in school %', NEW.role_id, NEW.school_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER membership_roles_integrity
  BEFORE INSERT OR UPDATE ON membership_roles
  FOR EACH ROW EXECUTE FUNCTION app.check_membership_role();

-- Platform staff can only hold platform-realm roles.
CREATE FUNCTION app.check_platform_membership_role() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
DECLARE
  v_realm public."Realm";
BEGIN
  SELECT r.realm INTO v_realm FROM public.roles r WHERE r.id = NEW.role_id;
  IF v_realm IS DISTINCT FROM 'platform' THEN
    RAISE EXCEPTION 'role % is not a platform role', NEW.role_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER platform_memberships_integrity
  BEFORE INSERT OR UPDATE ON platform_memberships
  FOR EACH ROW EXECUTE FUNCTION app.check_platform_membership_role();
