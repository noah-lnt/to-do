#!/bin/bash
set -e

# Configure WAL level for streaming replication
cat >> "$PGDATA/postgresql.conf" <<EOF

# ========================================
# Replication settings (auto-configured)
# ========================================
wal_level = replica
max_wal_senders = 4
wal_keep_size = '256MB'
hot_standby = on
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
EOF

# Create replication user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${REPLICATION_USER:-replicator}') THEN
            CREATE ROLE ${REPLICATION_USER:-replicator} WITH REPLICATION LOGIN PASSWORD '${REPLICATION_PASSWORD:-replicator_pass}';
        END IF;
    END
    \$\$;
EOSQL

# Allow replication connections in pg_hba.conf
echo "host replication ${REPLICATION_USER:-replicator} 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"

# Create WAL archive directory
mkdir -p /var/lib/postgresql/wal_archive

echo "Primary: replication configured successfully."
