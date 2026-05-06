#!/bin/bash
set -e

SERVER="sid@dockerbop.fr"
APP_DIR="/home/sid/apps/deckworkout"
URL="https://deckworkout.dockerbop.fr"

echo "=== Deploiement Deck Workout ==="

# 1. Push du code
echo "-> Push du code..."
git add -A
git commit -m "deploy: $(date +%Y-%m-%d_%H:%M)" || echo "  (rien a commit)"
git push origin main

# 2. Deploiement
echo "-> Deploiement sur le serveur..."
ssh "$SERVER" "bash -s" << 'ENDSSH'
set -e
cd /home/sid/apps/deckworkout
git pull origin main
docker compose up -d --build
sleep 4
docker compose ps
ENDSSH

# 3. Health check
echo "-> Verification..."
sleep 3
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "[OK] Deploye sur $URL"
else
  echo "[WARN] HTTP $HTTP_CODE -- voir: ssh $SERVER 'docker logs deckworkout-web --tail 50'"
fi

echo "=== Termine ==="
