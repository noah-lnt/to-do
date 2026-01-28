#!/bin/bash
# Check PostgreSQL replication status
# Usage: ./scripts/replication-status.sh
set -e

echo "============================================="
echo " PostgreSQL Replication Status"
echo "============================================="

echo ""
echo "--- Primary: replication slots & senders ---"
docker exec todo-db-primary psql -U postgres -d todoapp -c "
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replication_lag
FROM pg_stat_replication;
"

echo ""
echo "--- Replica: recovery status ---"
docker exec todo-db-replica psql -U postgres -d todoapp -c "
SELECT
  pg_is_in_recovery() AS is_replica,
  pg_last_wal_receive_lsn() AS received_lsn,
  pg_last_wal_replay_lsn() AS replayed_lsn,
  pg_last_xact_replay_timestamp() AS last_replayed_at,
  now() - pg_last_xact_replay_timestamp() AS replay_delay;
" 2>/dev/null || echo "  (replica not ready or not reachable)"

echo ""
echo "--- Primary: WAL archive status ---"
docker exec todo-db-primary psql -U postgres -d todoapp -c "
SELECT
  archived_count,
  failed_count,
  last_archived_wal,
  last_archived_time
FROM pg_stat_archiver;
"

echo ""
echo "============================================="
