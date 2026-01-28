# Guide de déploiement : Serveur unique + Traefik externe + NAS Synology

## Architecture cible

```
┌──────────────────────────────────────────────────────────────┐
│                        INTERNET                               │
│                           │                                   │
│                   DNS: todo.example.com                       │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────────┐ │
│  │                   Serveur partagé                        │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │         docker-compose.infra.yml (externe)          ││ │
│  │  │  ┌──────────────┐        ┌──────────────────┐       ││ │
│  │  │  │   Traefik    │        │   Uptime Kuma    │       ││ │
│  │  │  │   :80/443    │        │   (monitoring)   │       ││ │
│  │  │  └──────────────┘        └──────────────────┘       ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  │                           │                              │ │
│  │                    réseau "web"                          │ │
│  │                           │                              │ │
│  │  ┌────────────────────────▼────────────────────────────┐│ │
│  │  │          docker-compose.prod.yml (ce projet)        ││ │
│  │  │                                                     ││ │
│  │  │  ┌──────────────┐  ┌─────────────┐  ┌───────────┐  ││ │
│  │  │  │   Next.js    │──│ PostgreSQL  │──│  Backup   │  ││ │
│  │  │  │     App      │  │     DB      │  │  (cron)   │  ││ │
│  │  │  └──────────────┘  └─────────────┘  └─────┬─────┘  ││ │
│  │  └───────────────────────────────────────────┼────────┘│ │
│  └──────────────────────────────────────────────┼─────────┘ │
│                                            rsync/SSH        │
│                                           (quotidien)       │
│                                                 │            │
│                                                 ▼            │
│                                    ┌────────────────────┐   │
│                                    │   Synology NAS     │   │
│                                    │                    │   │
│                                    │ /volume1/backups/  │   │
│                                    │   taskflow/        │   │
│                                    │   ├── backup_..gz  │   │
│                                    │   └── ...          │   │
│                                    └────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Prérequis

| Composant | Description |
|---|---|
| **Serveur** | VPS Debian 11+ avec Docker et Docker Compose |
| **Traefik externe** | Instance Traefik partagée sur le même serveur |
| **Réseau Docker `web`** | Réseau externe pour la communication avec Traefik |
| **Uptime Kuma** | Monitoring externe (optionnel mais recommandé) |
| **Synology NAS** | Pour les backups quotidiens via rsync/SSH |

---

## Étape 1 : Préparer le serveur

### 1a. Installer Docker (si pas déjà fait)

```bash
# En tant que root
curl -fsSL https://get.docker.com | bash

# Créer un utilisateur de déploiement
adduser deploy
usermod -aG docker deploy
```

### 1b. Créer le réseau Docker externe

```bash
# Réseau partagé entre Traefik et les applications
docker network create web
```

### 1c. Configurer Traefik (si pas déjà fait)

Exemple minimal de `docker-compose.infra.yml` pour Traefik :

```yaml
# /opt/infra/docker-compose.yml
services:
  traefik:
    image: traefik:v3.2
    restart: unless-stopped
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=web"
      - "--entryPoints.web.address=:80"
      - "--entryPoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
      - "127.0.0.1:8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_certs:/letsencrypt
    networks:
      - web

volumes:
  traefik_certs:

networks:
  web:
    external: true
```

```bash
cd /opt/infra && docker compose up -d
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

### 2c. Configurer la clé SSH (depuis le serveur)

```bash
# Sur le serveur, en tant que root :
ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519_synology -N ""

# Copier la clé publique sur le Synology
ssh-copy-id -i /root/.ssh/id_ed25519_synology.pub admin@<IP_SYNOLOGY>

# Tester la connexion
ssh -i /root/.ssh/id_ed25519_synology admin@<IP_SYNOLOGY> "ls /volume1/backups/"
```

---

## Étape 3 : Déployer l'application

```bash
# Se connecter au serveur
ssh deploy@<IP_SERVEUR>

# Cloner le repo
sudo git clone <REPO_URL> /opt/taskflow
sudo chown -R deploy:deploy /opt/taskflow
cd /opt/taskflow

# Configurer l'environnement
cp deploy/env.prod.example .env
nano .env
```

### Variables à configurer dans `.env` :

```bash
# Générer des secrets aléatoires
APP_DOMAIN="todo.votre-domaine.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
POSTGRES_PASSWORD="$(openssl rand -base64 24)"

# Configurer le backup vers Synology
RSYNC_ENABLED="true"
RSYNC_TARGET="admin@<IP_SYNOLOGY>:/volume1/backups/taskflow"
SSH_KEY_PATH="/root/.ssh/id_ed25519_synology"

# Optionnel : emails (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_USER="noreply@example.com"
SMTP_PASSWORD="votre-mot-de-passe"
SMTP_FROM="TaskFlow <noreply@example.com>"
```

### Lancer l'application

```bash
# Démarrer la stack
docker compose -f docker-compose.prod.yml up -d --build

# Vérifier que tout tourne
docker compose -f docker-compose.prod.yml ps

# Initialiser la base de données
docker exec todo-app npx prisma db push

# (Optionnel) Charger les données de démo
docker exec todo-app npx tsx prisma/seed.ts

# Tester un backup immédiat
docker exec todo-backup /usr/local/bin/backup.sh
```

---

## Étape 4 : Vérifier que tout fonctionne

### Test de l'application

```bash
# L'application devrait être accessible sur
https://todo.votre-domaine.com

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f app
```

### Test du backup vers Synology

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
docker exec todo-backup /usr/local/bin/backup.sh
```

### Lister les backups

```bash
# Locaux (sur le serveur)
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

### Consulter les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml logs -f backup
```

---

## Mise à jour de l'application

```bash
cd /opt/taskflow

# Récupérer les dernières modifications
git pull origin main

# Rebuild et redémarrage
docker compose -f docker-compose.prod.yml up -d --build app

# Appliquer les migrations Prisma si nécessaire
docker exec todo-app npx prisma db push
```

---

## CI/CD : Déploiement automatique

Le projet inclut un pipeline GitHub Actions qui déploie automatiquement l'application sur le serveur à chaque push sur `main`.

### Architecture CI/CD

```
GitHub (push main) → GitHub Actions → SSH → Serveur Production
                          │
                    ┌─────┴─────┐
                    │ 1. Lint   │
                    │ 2. Deploy │
                    │ 3. Notify │
                    └───────────┘
```

### Configuration des secrets GitHub

Aller dans **Settings > Secrets and variables > Actions** et ajouter :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `DEPLOY_HOST` | IP ou hostname du serveur | `203.0.113.50` |
| `DEPLOY_USER` | Utilisateur SSH | `deploy` |
| `DEPLOY_SSH_KEY` | Clé privée SSH (ed25519) | Contenu de `~/.ssh/id_ed25519` |
| `DEPLOY_PATH` | Chemin de l'application | `/opt/taskflow` |
| `APP_DOMAIN` | Domaine de l'application | `todo.example.com` |

**Optionnel** (dans Variables, pas Secrets) :

| Variable | Description |
|----------|-------------|
| `SLACK_WEBHOOK_URL` | Webhook Slack pour notifications |

### Configuration serveur pour CI/CD

```bash
# 1. Créer l'utilisateur deploy (si pas déjà fait)
adduser deploy --disabled-password
usermod -aG docker deploy
chown -R deploy:deploy /opt/taskflow

# 2. Générer une clé SSH pour GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N "" -C "github-actions"

# 3. Autoriser cette clé
cat ~/.ssh/github_actions.pub >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys

# 4. Copier la clé PRIVÉE dans GitHub Secrets (DEPLOY_SSH_KEY)
cat ~/.ssh/github_actions
```

### Fonctionnement du pipeline

Le workflow `.github/workflows/deploy.yml` :

1. **CI** : Vérifie le code (lint + type-check)
2. **Deploy** : Se connecte en SSH et exécute :
   - `git fetch && git reset --hard origin/main`
   - `docker compose up -d --build app`
   - `prisma db push`
3. **Health Check** : Vérifie que `/api/health` répond 200
4. **Notify** : Envoie une notification Slack (optionnel)

### Endpoint Health Check

L'application expose un endpoint `/api/health` :

```json
{
  "status": "ok",
  "timestamp": "2026-01-28T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "uptime": 3600
  }
}
```

### Rollback

**Option 1 : Via GitHub Actions UI**

1. Aller dans **Actions > Rollback Deployment**
2. Cliquer sur **Run workflow**
3. Entrer le SHA du commit cible
4. Taper "rollback" pour confirmer

**Option 2 : Manuellement sur le serveur**

```bash
cd /opt/taskflow
./scripts/rollback.sh <commit-sha>
```

### Vérifier le déploiement

```bash
# Voir le dernier déploiement
git log -1 --oneline

# Vérifier l'état de l'app
curl https://todo.example.com/api/health

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f app
```

---

## Monitoring

### Avec Uptime Kuma (recommandé)

Si vous avez Uptime Kuma sur le même serveur ou ailleurs :

1. Ajouter un monitor HTTP(s) : `https://todo.votre-domaine.com`
2. Configurer les alertes (email, Discord, Telegram, etc.)

### Vérification des backups

Créer un cron pour vérifier que les backups récents existent :

```bash
# /etc/cron.d/check-taskflow-backup
0 9 * * * root test $(find /opt/taskflow-backups -name "*.sql.gz" -mtime -1 | wc -l) -gt 0 || echo "ALERTE: Pas de backup TaskFlow depuis 24h" | mail -s "TaskFlow backup alert" admin@example.com
```

---

## Troubleshooting

### L'app ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs app

# Vérifier que la DB est prête
docker compose -f docker-compose.prod.yml logs db
```

### Problème de certificat SSL

```bash
# Vérifier les logs Traefik
docker logs traefik --tail 100

# Vérifier que le domaine pointe vers le serveur
dig todo.votre-domaine.com
```

### Backup ne fonctionne pas

```bash
# Tester manuellement
docker exec todo-backup /usr/local/bin/backup.sh

# Vérifier la connexion SSH au Synology
docker exec todo-backup ssh -i /root/.ssh/id_ed25519 admin@<IP_SYNOLOGY> "ls /volume1/backups/"
```
