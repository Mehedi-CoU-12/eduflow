#!/usr/bin/env bash
# Runs once when the Postgres container initialises an empty data directory.
# Creates the EduFlow roles plus the development and test databases.
set -euo pipefail

SQL_DIR=/opt/eduflow/sql

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_password="$EDUFLOW_OWNER_PASSWORD" \
  -v app_password="$EDUFLOW_APP_PASSWORD" \
  -v system_password="$EDUFLOW_SYSTEM_PASSWORD" \
  -f "$SQL_DIR/001_roles.sql"

for db in eduflow eduflow_test; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    -v db_name="$db" -f "$SQL_DIR/002_database.sql"
done
