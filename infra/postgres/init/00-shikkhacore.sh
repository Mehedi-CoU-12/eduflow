#!/usr/bin/env bash
# Runs once when the Postgres container initialises an empty data directory.
# Creates the ShikkhaCore roles plus the development and test databases.
set -euo pipefail

SQL_DIR=/opt/shikkhacore/sql

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_password="$SHIKKHACORE_OWNER_PASSWORD" \
  -v app_password="$SHIKKHACORE_APP_PASSWORD" \
  -v system_password="$SHIKKHACORE_SYSTEM_PASSWORD" \
  -f "$SQL_DIR/001_roles.sql"

for db in shikkhacore shikkhacore_test; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    -v db_name="$db" -f "$SQL_DIR/002_database.sql"
done
