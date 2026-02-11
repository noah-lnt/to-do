#!/bin/bash
# =============================================================
# Setup initial d'un serveur Debian pour TaskFlow
# A exécuter en root sur un VPS Debian 12 fraîchement installé
# =============================================================
set -e

echo "========================================="
echo " Setup serveur Debian pour TaskFlow"
echo "========================================="

# ---------------------------------------------------------
# 1. Mise à jour système
# ---------------------------------------------------------
echo ""
echo "[1/5] Mise à jour du système..."
apt-get update && apt-get upgrade -y

# ---------------------------------------------------------
# 2. Installation de Docker
# ---------------------------------------------------------
echo ""
echo "[2/5] Installation de Docker..."
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# ---------------------------------------------------------
# 3. Outils utiles
# ---------------------------------------------------------
echo ""
echo "[3/5] Installation des outils..."
apt-get install -y git ufw fail2ban htop curl wget unzip rsync

# ---------------------------------------------------------
# 4. Firewall (UFW)
# ---------------------------------------------------------
echo ""
echo "[4/5] Configuration du firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
echo "y" | ufw enable

# ---------------------------------------------------------
# 5. Fail2ban
# ---------------------------------------------------------
echo ""
echo "[5/5] Configuration de fail2ban..."
cat > /etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
JAIL

systemctl enable fail2ban
systemctl restart fail2ban

# ---------------------------------------------------------
# 6. Créer le réseau Docker externe pour Traefik
# ---------------------------------------------------------
echo ""
echo "[Bonus] Création du réseau Docker 'web'..."
docker network create web 2>/dev/null || echo "Le réseau 'web' existe déjà"

echo ""
echo "========================================="
echo " Setup terminé !"
echo "========================================="
echo ""
echo " Docker : $(docker --version)"
echo " UFW    : actif (22, 80, 443)"
echo " Fail2ban : actif"
echo " Réseau Docker 'web' : créé"
echo ""
echo " Prochaines étapes :"
echo ""
echo " 1. Créer un utilisateur non-root :"
echo "    adduser deploy && usermod -aG docker deploy"
echo ""
echo " 2. Déployer Traefik (si pas déjà fait) :"
echo "    Voir deploy/GUIDE-DEPLOIEMENT.md"
echo ""
echo " 3. Cloner le repo et configurer .env :"
echo "    git clone <repo> /opt/taskflow && cd /opt/taskflow"
echo "    cp deploy/env.prod.example .env && nano .env"
echo ""
echo " 4. Lancer l'application :"
echo "    docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "========================================="
