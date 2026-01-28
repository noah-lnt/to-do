#!/bin/bash
# Trigger an immediate backup
# Usage: ./scripts/backup-now.sh
set -e

echo "Triggering immediate backup..."
docker exec todo-backup /usr/local/bin/backup.sh
echo "Done."
