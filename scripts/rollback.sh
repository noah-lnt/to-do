#!/bin/bash
# =============================================================
# Rollback TaskFlow to a previous commit
# Usage: ./rollback.sh <commit-sha>
# =============================================================
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/opt/taskflow}"
COMPOSE_FILE="docker-compose.prod.yml"

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: Commit SHA required${NC}"
    echo ""
    echo "Usage: $0 <commit-sha>"
    echo ""
    echo "Recent commits:"
    cd "$DEPLOY_PATH" && git log --oneline -10
    exit 1
fi

COMMIT_SHA="$1"

echo "========================================="
echo " TaskFlow Rollback"
echo "========================================="
echo ""

cd "$DEPLOY_PATH"

# Verify commit exists
if ! git cat-file -e "$COMMIT_SHA^{commit}" 2>/dev/null; then
    echo -e "${RED}Error: Commit $COMMIT_SHA not found${NC}"
    exit 1
fi

# Show what we're rolling back to
echo -e "${YELLOW}Rolling back to:${NC}"
git log --oneline -1 "$COMMIT_SHA"
echo ""

# Confirmation
read -p "Are you sure you want to rollback? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

# Create backup of current state
CURRENT_SHA=$(git rev-parse HEAD)
echo ""
echo -e "${YELLOW}[1/4] Creating backup point...${NC}"
echo "Current commit: $CURRENT_SHA"

# Checkout the target commit
echo ""
echo -e "${YELLOW}[2/4] Checking out $COMMIT_SHA...${NC}"
git fetch origin
git checkout "$COMMIT_SHA"

# Rebuild and restart
echo ""
echo -e "${YELLOW}[3/4] Rebuilding application...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --build app

# Wait for app to start
echo ""
echo -e "${YELLOW}[4/4] Waiting for application to start...${NC}"
sleep 10

# Run migrations (in case schema changed)
echo "Running database migrations..."
docker exec todo-app npx prisma db push --skip-generate || true

# Health check
echo ""
echo "Checking application health..."
sleep 5

if docker exec todo-app curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN} Rollback successful!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "Rolled back to: $COMMIT_SHA"
    echo "Previous commit was: $CURRENT_SHA"
    echo ""
    echo "To undo this rollback, run:"
    echo "  $0 $CURRENT_SHA"
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED} Warning: Health check failed${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "The application may not be running correctly."
    echo "Check logs with: docker compose -f $COMPOSE_FILE logs app"
    echo ""
    echo "To revert to previous state:"
    echo "  $0 $CURRENT_SHA"
    exit 1
fi
