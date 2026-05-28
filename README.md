> ⚠️ **Development moved to a private repo.** This v1 is kept as-is for reference.
> The v2 (AI brain dump, weekly planning, Gmail/IMAP sync, MCP server, multi-channel capture)
> is being developed privately at **noah-lnt/taskflow**.

# TaskFlow - Gestionnaire de tâches

Application de gestion de tâches moderne et productive construite avec Next.js, PostgreSQL, shadcn/ui, et déployable avec Docker + Traefik.

## Fonctionnalités

- **Gestion de tâches complète** : CRUD complet avec titre, description, priorité, statut et date d'échéance
- **Catégories personnalisables** : Organisez vos tâches par catégories avec couleurs
- **Drag & Drop** : Réorganisez vos tâches par glisser-déposer
- **Recherche et filtres** : Recherche textuelle, filtres par statut, priorité, catégorie
- **Tri avancé** : Par date, priorité, position, alphabétique
- **Tableau de bord** : Statistiques en temps réel, progression globale
- **Mode sombre** : Theme clair/sombre automatique ou manuel
- **Authentification** : Inscription/Connexion sécurisée avec JWT
- **Responsive** : Interface adaptée mobile, tablette et desktop
- **Raccourcis clavier** : `N` pour ajouter rapidement une tâche

## Stack technique

- **Frontend** : Next.js 16, React 19, TypeScript
- **UI** : shadcn/ui, Tailwind CSS 4, Lucide Icons
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL 16 + Prisma ORM
- **Auth** : JWT custom avec jose
- **Drag & Drop** : @dnd-kit
- **Infrastructure** : Docker, Docker Compose, Traefik

## Démarrage rapide

### Prérequis

- Node.js 20+
- Docker & Docker Compose (pour PostgreSQL)

### Installation locale

```bash
# Cloner le projet
git clone <repo-url>
cd to-do

# Installer les dépendances
npm install

# Lancer PostgreSQL avec Docker
npm run docker:dev

# Initialiser la base de données
npm run db:push

# (Optionnel) Données de démo
npm run db:seed

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur http://localhost:3000

**Compte démo** (après seed) : `demo@taskflow.app` / `demo123`

### Déploiement avec Docker + Traefik

```bash
# Configurer les variables d'environnement
cp .env.example .env
# Modifier les valeurs dans .env

# Lancer toute la stack
npm run docker:up
```

L'application sera accessible via Traefik sur le port 80.
Le dashboard Traefik est accessible sur http://localhost:8080.

### Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://postgres:postgres@localhost:5432/todoapp` |
| `NEXTAUTH_SECRET` | Secret pour les JWT | `change-me-in-production` |
| `NEXTAUTH_URL` | URL publique de l'app | `http://localhost:3000` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL (Docker) | `postgres` |
| `APP_DOMAIN` | Domaine pour Traefik | `localhost` |

## Structure du projet

```
├── prisma/
│   ├── schema.prisma      # Schéma de la base de données
│   └── seed.ts            # Script de données de démo
├── src/
│   ├── app/
│   │   ├── api/            # Routes API (tasks, categories, auth)
│   │   ├── (auth)/         # Pages d'authentification
│   │   ├── globals.css     # Styles globaux + thème shadcn
│   │   ├── layout.tsx      # Layout racine
│   │   └── page.tsx        # Page principale
│   ├── components/
│   │   ├── ui/             # Composants shadcn/ui
│   │   ├── dashboard.tsx   # Dashboard principal
│   │   ├── sidebar.tsx     # Barre latérale navigation
│   │   ├── task-card.tsx   # Carte de tâche
│   │   ├── task-dialog.tsx # Dialogue création/édition
│   │   ├── task-list.tsx   # Liste avec drag & drop
│   │   └── ...
│   ├── hooks/              # Hooks React custom
│   └── lib/                # Utilitaires, types, auth
├── traefik/                # Configuration Traefik
├── docker-compose.yml      # Production avec Traefik
├── docker-compose.dev.yml  # Dev (PostgreSQL uniquement)
├── Dockerfile              # Image de production
└── README.md
```
