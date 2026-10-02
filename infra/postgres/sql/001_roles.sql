-- ShikkhaCore database roles.
--
-- Run as a superuser (or a role allowed to create roles) with psql variables:
--   psql -v owner_password=... -v app_password=... -v system_password=... -f 001_roles.sql
--
--   shikkhacore_owner   Owns the schema and runs migrations. Never used by the running API.
--   shikkhacore_app     Used for normal API requests. Subject to row level security.
--   shikkhacore_system  Used only by narrow trusted code paths (auth, tenant resolution,
--                       platform administration, seeding). Granted access through explicit
--                       "system_access" policies instead of BYPASSRLS, so the grant works on
--                       managed PostgreSQL services as well.
--
-- This script is idempotent: existing roles get their password and attributes reset.

SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shikkhacore_owner') AS create_owner \gset
\if :create_owner
  CREATE ROLE shikkhacore_owner;
\endif
ALTER ROLE shikkhacore_owner WITH LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOBYPASSRLS PASSWORD :'owner_password';

SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shikkhacore_app') AS create_app \gset
\if :create_app
  CREATE ROLE shikkhacore_app;
\endif
ALTER ROLE shikkhacore_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD :'app_password';

SELECT NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shikkhacore_system') AS create_system \gset
\if :create_system
  CREATE ROLE shikkhacore_system;
\endif
ALTER ROLE shikkhacore_system WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD :'system_password';
