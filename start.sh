#!/bin/bash
echo "Starting SCCU platform..."

# PostgreSQL
podman start sccu-db 2>/dev/null || \
podman run --name sccu-db --network host --detach \
  -e POSTGRES_DB=sccu -e POSTGRES_USER=sccu_admin \
  -e POSTGRES_PASSWORD=Sccu2026#DB \
  -v /home/navila/sccu/pgdata:/var/lib/postgresql/data:Z \
  docker.io/postgres:15

# Redis
podman start sccu-redis 2>/dev/null || \
podman run --name sccu-redis --network host --detach \
  docker.io/redis:7 redis-server --save "" --appendonly no --protected-mode no

# OBP
podman start sccu-core 2>/dev/null || \
podman run --name sccu-core --network host --detach \
  --env-file /home/navila/sccu/obp.env \
  docker.io/openbankproject/obp-api

# FastAPI
pkill -f uvicorn 2>/dev/null
sleep 1
cd /home/navila/sccu
uvicorn api:app --host 0.0.0.0 --port 3001 &

echo ""
echo "SCCU running:"
echo "  API:      http://localhost:3001"
echo "  Docs:     http://localhost:3001/docs"
echo "  Dashboard: http://localhost:5174"
echo ""
echo "Start ngrok: ngrok http 3001"
echo "Then rebuild: cd ~/sccu/frontend && npm run build"
