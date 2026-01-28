# Guide de déploiement : 2 VPS Debian + Synology NAS

## Architecture cible

```
┌──────────────────────────────────────────────────────┐
│                    INTERNET                          │
│                       │                              │
│               DNS: todo.example.com                  │
│                       │                              │
│  ┌────────────────────▼─────────────────────────┐    │
│  │              VPS 1 (Primary)                  │    │
│  │                                               │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │    │
│  │  │ Traefik │──│ Next.js  │──│ PostgreSQL │  │    │
│  │  │ :80/443 │  │ App      │  │ Primary    │  │    │
│  │  └─────────┘  └──────────┘  └─────┬──────┘  │    │
│  │                                    │          │    │
│  │  ┌──────────────────┐    WAL stream│          │    │
│  │  │ Backup Container │              │          │    │
│  │  │ (cron 02:00)     │              │          │    │
│  │  └────────┬─────────┘              │          │    │
│  └───────────┼────────────────────────┼──────────┘    │
│              │                        │               │
│         rsync/SSH               Streaming             │
│         (quotidien)            Replication             │
│              │                   (temps réel)         │
│              ▼                        ▼               │
│  ┌───────────────────┐   ┌───────────────────────┐   │
│  │   Synology NAS    │   │    VPS 2 (Replica)    │   │
│  │                   │   │                       │   │
│  │ /volume1/backups/ │   │  ┌─────────────────┐  │   │
│  │   taskflow/       │   │  │   PostgreSQL    │  │   │
│  │   ├── backup_..gz │   │  │   Hot Standby   │  │   │
│  │   ├── backup_..gz │   │  │   (read-only)   │  │   │
│  │   └── ...         │   │  └─────────────────┘  │   │
│  └───────────────────┘   └───────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Rôle de chaque serveur :**

| Serveur | Rôle | Contient |
|---|---|---|
| VPS 1 | Primary | Traefik + App + PostgreSQL primary + Backups |
| VPS 2 | Replica | PostgreSQL hot standby (copie temps réel) |
| Synology | Stockage | Backups quotidiens (pg_dump compressés) |

---

## Étape 1 : Préparer les VPS Debian

Sur **chaque VPS** (en root) :

```bash
# Télécharger et exécuter le script de setup
curl -fsSL https://raw.githubusercontent.com/<repo>/main/scripts/setup-vps.sh | bash

# Créer un utilisateur de déploiement
adduser deploy
usermod -aG docker deploy
```

### Firewall sur VPS 1 uniquement

```bash
# Autoriser le VPS2 à se connecter en replication
ufw allow from <IP_VPS2> to any port 5432
```

### Firewall sur VPS 2

```bash
# Pas besoin de ports publics (pas d'app web dessus)
# Juste SSH
ufw allow 22/tcp
echo "y" | ufw enable
```

---

## Étape 2 : Préparer le Synology NAS

### 2a. Activer SSH sur le Synology

1. Ouvrir **DSM > Panneau de configuration > Terminal & SNMP**
2. Cocher **Activer le service SSH**
3. Appliquer

### 2b. Créer le dossier de backups

```bash
# Depuis le Synology (SSH) ou via File Station
mkdir -p /volume1/backups/taskflow
chown admin:users /volume1/backups/taskflow
```

### 2c. Configurer la clé SSH (depuis VPS 1)

```bash
# Sur le VPS 1, en tant que root :
ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519_synology -N ""

# Copier la clé publique sur le Synology
ssh-copy-id -i /root/.ssh/id_ed25519_synology.pub admin@<IP_SYNOLOGY>

# Tester la connexion
ssh -i /root/.ssh/id_ed25519_synology admin@<IP_SYNOLOGY> "ls /volume1/backups/"
```

---

## Étape 3 : Déployer le VPS 1 (Primary)

```bash
# Se connecter au VPS1
ssh deploy@<IP_VPS1>

# Cloner le repo
sudo git clone <REPO_URL> /opt/taskflow
sudo chown -R deploy:deploy /opt/taskflow
cd /opt/taskflow

# Configurer l'environnement
cp deploy/env.vps1.example .env
nano .env
```

**Variables à modifier dans `.env` :**

```bash
APP_DOMAIN="todo.votre-domaine.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
POSTGRES_PASSWORD="$(openssl rand -base64 24)"
REPLICATION_PASSWORD="$(openssl rand -base64 24)"
ACME_EMAIL="votre@email.com"
RSYNC_TARGET="admin@<IP_SYNOLOGY>:/volume1/backups/taskflow"
SSH_KEY_PATH="/root/.ssh/id_ed25519_synology"
```

```bash
# Lancer la stack
docker compose -f docker-compose.vps1.yml up -d --build

# Vérifier que tout tourne
docker compose -f docker-compose.vps1.yml ps

# Initialiser la base de données
docker exec todo-app npx prisma db push

# (Optionnel) Charger les données de démo
docker exec todo-app npx tsx prisma/seed.ts

# Tester un backup immédiat
docker exec todo-backup /usr/local/bin/backup.sh
```

---

## Étape 4 : Déployer le VPS 2 (Replica)

```bash
# Se connecter au VPS2
ssh deploy@<IP_VPS2>

# Cloner le repo
sudo git clone <REPO_URL> /opt/taskflow
sudo chown -R deploy:deploy /opt/taskflow
cd /opt/taskflow

# Configurer l'environnement
cp deploy/env.vps2.example .env
nano .env
```

**Variables à modifier dans `.env` :**

```bash
POSTGRES_PASSWORD="<même mot de passe que VPS1>"
PRIMARY_HOST="<IP_PUBLIQUE_DU_VPS1>"
REPLICATION_PASSWORD="<même mot de passe que VPS1>"
```

```bash
# Lancer le replica
docker compose -f docker-compose.vps2.yml up -d

# Vérifier la replication (attendre ~30s)
docker exec todo-db-replica psql -U postgres -c "SELECT pg_is_in_recovery();"
# Doit afficher: t (true = replica mode)

# Vérifier les données sont bien répliquées
docker exec todo-db-replica psql -U postgres -d todoapp -c "SELECT count(*) FROM \"User\";"
```

---

## Étape 5 : Vérifier que tout fonctionne

### Depuis le VPS 1 :

```bash
# Statut de la réplication
cd /opt/taskflow

# Vérifier les connexions de replication
docker exec todo-db-primary psql -U postgres -c \
  "SELECT client_addr, state, sent_lsn, replay_lsn,
   pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS lag
   FROM pg_stat_replication;"
```

Vous devez voir l'IP du VPS2 avec `state = streaming` et un `lag` quasi nul.

### Tester le backup vers Synology :

```bash
# Backup manuel
docker exec todo-backup /usr/local/bin/backup.sh

# Vérifier sur le Synology
ssh admin@<IP_SYNOLOGY> "ls -lh /volume1/backups/taskflow/"
```

---

## Opérations courantes

### Backup manuel

```bash
# Depuis le VPS1
docker exec todo-backup /usr/local/bin/backup.sh
```

### Lister les backups

```bash
# Locaux (VPS1)
docker exec todo-backup ls -lh /backups/

# Sur le Synology
ssh admin@<IP_SYNOLOGY> "ls -lh /volume1/backups/taskflow/"
```

### Restaurer un backup

```bash
# Depuis un backup local
docker exec todo-backup /usr/local/bin/restore.sh backup_todoapp_20260128_020000.sql.gz

# Depuis le Synology (copier d'abord)
scp admin@<IP_SYNOLOGY>:/volume1/backups/taskflow/backup_todoapp_20260128_020000.sql.gz /tmp/
docker cp /tmp/backup_todoapp_20260128_020000.sql.gz todo-backup:/backups/
docker exec todo-backup /usr/local/bin/restore.sh backup_todoapp_20260128_020000.sql.gz
```

### Consulter les logs de backup

```bash
docker logs todo-backup --tail 100
```

---

## Failover (en cas de panne du VPS 1)

Si le VPS 1 tombe, vous pouvez promouvoir le VPS 2 :

```bash
# Sur le VPS 2 :
cd /opt/taskflow
bash scripts/promote-replica.sh
```

Ensuite :

1. **Modifier le DNS** de `todo.votre-domaine.com` → IP du VPS 2
2. **Copier l'app** sur le VPS 2 et la lancer :
   ```bash
   cp deploy/env.vps1.example .env
   # Modifier .env avec DATABASE_URL pointant vers localhost
   docker compose -f docker-compose.vps1.yml up -d app traefik
   ```
3. **Quand le VPS 1 sera réparé**, le reconfigurer comme replica du VPS 2

---

## Mise à jour de l'application

```bash
# Sur le VPS 1
cd /opt/taskflow
git pull origin main

# Rebuild et redémarrage
docker compose -f docker-compose.vps1.yml up -d --build app

# Appliquer les migrations Prisma si nécessaire
docker exec todo-app npx prisma db push
```

---

## Monitoring recommandé

Pour un setup production, pensez à ajouter :

- **Uptime monitoring** : UptimeRobot, Hetrixtools (gratuit)
- **Alertes disque** : notification si le VPS dépasse 80% de stockage
- **Alertes replication** : cron qui vérifie le lag et alerte si > 1 min
- **Alertes backup** : vérifier que le dernier backup a moins de 25h

Exemple de script d'alerte replication (à mettre en cron sur VPS1) :

```bash
#!/bin/bash
LAG=$(docker exec todo-db-primary psql -U postgres -tAc \
  "SELECT EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp())
   FROM pg_stat_replication LIMIT 1;" 2>/dev/null || echo "999")

if [ "${LAG%.*}" -gt 60 ]; then
  echo "ALERTE: Replication lag = ${LAG}s" | mail -s "TaskFlow: replication lag" admin@example.com
fi
```
