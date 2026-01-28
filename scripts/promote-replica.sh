#!/bin/bash
# =============================================================
# Promote PostgreSQL Replica to Primary (failover)
# =============================================================
# A exécuter SUR LE VPS2 en cas de panne du VPS1
#
# Usage: ./scripts/promote-replica.sh
# =============================================================
set -e

echo "========================================="
echo " FAILOVER: Promotion du replica"
echo "========================================="
echo ""
echo "ATTENTION: cette opération est irréversible."
echo "Le replica va devenir le nouveau primary (read/write)."
echo ""
echo "Appuyez sur Ctrl+C dans 5 secondes pour annuler..."
sleep 5

echo ""
echo "[1/3] Vérification du statut actuel..."
IS_REPLICA=$(docker exec todo-db-replica psql -U postgres -tAc "SELECT pg_is_in_recovery();" 2>/dev/null || echo "error")

if [ "$IS_REPLICA" != "t" ]; then
  echo "   ERREUR: Ce serveur n'est pas en mode replica (pg_is_in_recovery = ${IS_REPLICA})"
  echo "   Abandon."
  exit 1
fi
echo "   Statut: replica confirmé."

echo ""
echo "[2/3] Promotion en primary..."
docker exec todo-db-replica pg_ctl promote -D /var/lib/postgresql/data
sleep 3

echo ""
echo "[3/3] Vérification post-promotion..."
IS_PRIMARY=$(docker exec todo-db-replica psql -U postgres -tAc "SELECT pg_is_in_recovery();" 2>/dev/null || echo "error")

if [ "$IS_PRIMARY" = "f" ]; then
  echo "   Promotion réussie ! Ce serveur est maintenant le PRIMARY."
else
  echo "   ERREUR: La promotion a échoué (pg_is_in_recovery = ${IS_PRIMARY})"
  exit 1
fi

echo ""
echo "========================================="
echo " Prochaines étapes :"
echo "========================================="
echo ""
echo " 1. Mettre à jour le DNS de ${APP_DOMAIN:-votre-domaine}"
echo "    pour pointer vers l'IP de ce VPS"
echo ""
echo " 2. Lancer l'app sur ce VPS :"
echo "    DATABASE_URL=postgresql://postgres:***@localhost:5432/todoapp"
echo "    docker compose -f docker-compose.vps1.yml up -d app traefik"
echo ""
echo " 3. Quand le VPS1 sera réparé, le reconfigurer"
echo "    comme nouveau replica du VPS2."
echo "========================================="
