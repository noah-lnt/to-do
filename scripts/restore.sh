#!/bin/bash
# Restore a backup
# Usage: ./scripts/restore.sh <backup_filename.sql.gz> [--from-s3]
# List backups: ./scripts/restore.sh
set -e

if [ -z "$1" ]; then
  echo "Available local backups:"
  docker exec todo-backup ls -lh /backups/backup_*.sql.gz 2>/dev/null || echo "  (none found)"
  echo ""
  echo "Usage: $0 <backup_filename.sql.gz> [--from-s3]"
  exit 0
fi

echo "Restoring backup: $1"
docker exec todo-backup /usr/local/bin/restore.sh "$1" "${2:-}"
