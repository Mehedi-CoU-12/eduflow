-- Creates a ShikkhaCore database owned by shikkhacore_owner.
--
--   psql -v db_name=shikkhacore -f 002_database.sql
--
-- Only the three ShikkhaCore roles may connect. Tables, grants and row level security
-- policies are created by Prisma migrations (apps/api/prisma/migrations).

SELECT NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') AS create_db \gset
\if :create_db
  CREATE DATABASE :"db_name" OWNER shikkhacore_owner;
\endif

REVOKE ALL ON DATABASE :"db_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO shikkhacore_app, shikkhacore_system;
