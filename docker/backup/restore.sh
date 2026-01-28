#!/bin/bash
# =============================================================
# PostgreSQL Restore Script
# Usage: restore.sh <backup_file.sql.gz> [--from-s3]
# =============================================================
set -euo pipefail

DB_HOST="${DB_HOST:-db-primary}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-todoapp}"
BACKUP_DIR="/backups"

S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-postgres-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-}"

BACKUP_FILE="${1:-}"
FROM_S3="${2:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: restore.sh <backup_file.sql.gz> [--from-s3]"
  echo ""
  echo "Available local backups:"
  ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

echo "========================================="
echo " PostgreSQL Restore"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# Download from S3 if requested
if [ "$FROM_S3" = "--from-s3" ]; then
  echo "Downloading ${BACKUP_FILE} from S3..."
  S3_CMD_ARGS=""
  if [ -n "$S3_ENDPOINT" ]; then
    S3_CMD_ARGS="--endpoint-url $S3_ENDPOINT"
  fi
  aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}" "${BACKUP_DIR}/${BACKUP_FILE}" $S3_CMD_ARGS
  echo "Download complete."
fi

RESTORE_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

if [ ! -f "$RESTORE_PATH" ]; then
  echo "ERROR: Backup file not found: ${RESTORE_PATH}"
  exit 1
fi

echo ""
echo "WARNING: This will DROP and recreate the database '${DB_NAME}'."
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

echo ""
echo "Dropping and recreating database..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
  2>/dev/null || true

PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};"

PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "CREATE DATABASE ${DB_NAME};"

echo "Restoring from ${BACKUP_FILE}..."
gunzip -c "$RESTORE_PATH" | PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --quiet

echo ""
echo "========================================="
echo " Restore Complete"
echo "========================================="
echo " Source: ${BACKUP_FILE}"
echo " Target: ${DB_NAME}@${DB_HOST}"
echo "========================================="
