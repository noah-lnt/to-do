#!/bin/bash
# =============================================================
# Setup initial d'un VPS Debian pour TaskFlow
# A exécuter en root sur un VPS Debian 12 fraîchement installé
# =============================================================
set -e

echo "========================================="
echo " Setup VPS Debian pour TaskFlow"
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
# Le port 5432 sera ajouté manuellement pour l'IP du VPS2
echo "y" | ufw enable

echo ""
echo "   IMPORTANT: Pour autoriser la réplication PostgreSQL"
echo "   depuis le VPS2, exécuter :"
echo "   ufw allow from <IP_VPS2> to any port 5432"

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

echo ""
echo "========================================="
echo " Setup terminé !"
echo "========================================="
echo ""
echo " Docker : $(docker --version)"
echo " UFW    : actif (22, 80, 443)"
echo " Fail2ban : actif"
echo ""
echo " Prochaines étapes :"
echo " 1. Créer un utilisateur non-root :"
echo "    adduser deploy && usermod -aG docker deploy"
echo ""
echo " 2. Cloner le repo et configurer .env :"
echo "    git clone <repo> /opt/taskflow && cd /opt/taskflow"
echo "    cp .env.example .env && nano .env"
echo ""
echo " 3. Sur VPS1 (primary) :"
echo "    docker compose -f docker-compose.vps1.yml up -d --build"
echo ""
echo " 4. Sur VPS2 (replica) :"
echo "    docker compose -f docker-compose.vps2.yml up -d"
echo "========================================="
