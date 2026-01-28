#!/bin/bash
# =============================================================
# PostgreSQL Backup Script
# Supports: local storage + S3-compatible object storage
# =============================================================
set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-db-primary}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-todoapp}"
BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# S3 configuration (optional)
S3_ENABLED="${S3_ENABLED:-false}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-postgres-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-}"

echo "========================================="
echo " PostgreSQL Backup"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------
# 1. pg_dump (compressed)
# ---------------------------------------------------------
echo ""
echo "[1/4] Running pg_dump..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --verbose 2>/dev/null | gzip > "$BACKUP_PATH"

BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
echo "   Backup created: ${BACKUP_FILENAME} (${BACKUP_SIZE})"

# ---------------------------------------------------------
# 2. Verify backup integrity
# ---------------------------------------------------------
echo ""
echo "[2/4] Verifying backup integrity..."
if gzip -t "$BACKUP_PATH" 2>/dev/null; then
  echo "   Backup integrity: OK"
else
  echo "   ERROR: Backup file is corrupted!"
  exit 1
fi

# ---------------------------------------------------------
# 3. Upload to S3 (if enabled)
# ---------------------------------------------------------
echo ""
echo "[3/4] S3 upload..."
if [ "$S3_ENABLED" = "true" ] && [ -n "$S3_BUCKET" ]; then
  S3_DEST="s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILENAME}"

  S3_CMD_ARGS=""
  if [ -n "$S3_ENDPOINT" ]; then
    S3_CMD_ARGS="--endpoint-url $S3_ENDPOINT"
  fi

  echo "   Uploading to ${S3_DEST}..."
  aws s3 cp "$BACKUP_PATH" "$S3_DEST" $S3_CMD_ARGS --quiet
  echo "   Upload complete."

  # Clean old S3 backups
  echo "   Cleaning S3 backups older than ${RETENTION_DAYS} days..."
  CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y%m%d)
  aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" $S3_CMD_ARGS 2>/dev/null | while read -r line; do
    FILE_DATE=$(echo "$line" | grep -oP 'backup_\w+_\K\d{8}' || true)
    FILE_NAME=$(echo "$line" | awk '{print $NF}')
    if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
      echo "   Deleting old backup: ${FILE_NAME}"
      aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}" $S3_CMD_ARGS --quiet
    fi
  done
else
  echo "   S3 disabled, skipping."
fi

# ---------------------------------------------------------
# 4. Clean old local backups
# ---------------------------------------------------------
echo ""
echo "[4/4] Cleaning local backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "   Deleted ${DELETED_COUNT} old backup(s)."

# ---------------------------------------------------------
# Summary
# ---------------------------------------------------------
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo "========================================="
echo " Backup Complete"
echo "========================================="
echo " File     : ${BACKUP_FILENAME}"
echo " Size     : ${BACKUP_SIZE}"
echo " Local    : ${TOTAL_BACKUPS} backup(s), ${TOTAL_SIZE} total"
echo " S3       : ${S3_ENABLED}"
echo " Duration : ${SECONDS}s"
echo "========================================="
