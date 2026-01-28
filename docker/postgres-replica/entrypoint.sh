#!/bin/bash
set -e

echo "Replica: Waiting for primary to be ready..."

until PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_isready -h "${PRIMARY_HOST:-db-primary}" -p 5432 -U "${POSTGRES_USER:-postgres}"; do
  echo "Replica: Primary not ready yet, retrying in 2s..."
  sleep 2
done

echo "Replica: Primary is ready. Checking data directory..."

# If data directory is empty, run pg_basebackup
if [ -z "$(ls -A "$PGDATA" 2>/dev/null)" ]; then
  echo "Replica: Empty data dir, running pg_basebackup from primary..."

  PGPASSWORD="${REPLICATION_PASSWORD:-replicator_pass}" pg_basebackup \
    -h "${PRIMARY_HOST:-db-primary}" \
    -p 5432 \
    -U "${REPLICATION_USER:-replicator}" \
    -D "$PGDATA" \
    -Fp -Xs -P -R

  echo "Replica: Base backup complete."
else
  echo "Replica: Data directory already initialized, checking standby.signal..."
  # Ensure standby.signal exists
  touch "$PGDATA/standby.signal"
fi

# Ensure proper connection info in postgresql.auto.conf
cat > "$PGDATA/postgresql.auto.conf" <<EOF
primary_conninfo = 'host=${PRIMARY_HOST:-db-primary} port=5432 user=${REPLICATION_USER:-replicator} password=${REPLICATION_PASSWORD:-replicator_pass}'
EOF

# Ensure standby.signal file exists
touch "$PGDATA/standby.signal"

# Apply replica-specific settings
cat >> "$PGDATA/postgresql.conf" 2>/dev/null <<EOF || true

# Replica settings
hot_standby = on
hot_standby_feedback = on
EOF

echo "Replica: Starting PostgreSQL in standby mode..."
exec postgres
