#!/bin/bash
set -e

SERVER="sid@dockerbop.fr"
APP_DIR="/home/sid/apps/deckworkout"
URL="https://deckworkout.dockerbop.fr"

echo "=== Deploiement Deck Workout ==="

# Source secrets (VAPID keys for push notifs)
if [ -f ~/Dev/.api-keys.sh ]; then
  source ~/Dev/.api-keys.sh
fi

if [ -z "${DECKWORKOUT_VAPID_PUBLIC:-}" ] || [ -z "${DECKWORKOUT_VAPID_PRIVATE:-}" ]; then
  echo "[WARN] VAPID keys missing. Push notifs won't work. Set DECKWORKOUT_VAPID_* in ~/Dev/.api-keys.sh"
fi

# 1. Push du code
echo "-> Push du code..."
git add -A
git commit -m "deploy: $(date +%Y-%m-%d_%H:%M)" || echo "  (rien a commit)"
git push origin main

# 2. Deploiement
echo "-> Deploiement sur le serveur..."
ssh "$SERVER" "bash -s" <<ENDSSH
set -e
cd $APP_DIR
git pull origin main

# Write server-side .env consumed by docker-compose
cat > .env <<EOF
VAPID_PUBLIC_KEY=${DECKWORKOUT_VAPID_PUBLIC:-}
VAPID_PRIVATE_KEY=${DECKWORKOUT_VAPID_PRIVATE:-}
VAPID_SUBJECT=${DECKWORKOUT_VAPID_SUBJECT:-mailto:admin@dockerbop.fr}
EOF
chmod 600 .env

docker compose up -d --build
sleep 4
docker compose ps
ENDSSH

# 3. Health check
echo "-> Verification..."
sleep 3
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
API_HEALTH=$(curl -sf -o /dev/null -w "%{http_code}" "$URL/api/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "[OK] Web deploye sur $URL"
else
  echo "[WARN] Web HTTP $HTTP_CODE -- voir: ssh $SERVER 'docker logs deckworkout-web --tail 50'"
fi
if [ "$API_HEALTH" = "200" ]; then
  echo "[OK] API deploye sur $URL/api"
else
  echo "[WARN] API HTTP $API_HEALTH -- voir: ssh $SERVER 'docker logs deckworkout-api --tail 50'"
fi

echo "=== Termine ==="
