#!/bin/bash
echo "Starting SCCU platform..."

# Start PostgreSQL
podman start sccu-db 2>/dev/null || \
podman run --name sccu-db --network host --detach \
  -e POSTGRES_DB=sccu -e POSTGRES_USER=sccu_admin \
  -e POSTGRES_PASSWORD=Sccu2026#DB \
  -v /home/navila/sccu/pgdata:/var/lib/postgresql/data:Z \
  docker.io/postgres:15

# Start Redis
podman start sccu-redis 2>/dev/null || \
podman run --name sccu-redis --network host --detach \
  docker.io/redis:7 redis-server --save "" --appendonly no --protected-mode no

# Start OBP
podman start sccu-core 2>/dev/null || \
podman run --name sccu-core --network host --detach \
  --env-file /home/navila/sccu/obp.env \
  docker.io/openbankproject/obp-api

# Start FastAPI
pkill -f "uvicorn api:app" 2>/dev/null
cd /home/navila/sccu
uvicorn api:app --host 0.0.0.0 --port 3001 &

# Start React dashboard
cd /home/navila/sccu/frontend
npm run dev -- --host 0.0.0.0 &

echo ""
echo "SCCU platform starting..."
echo "  Dashboard:  http://localhost:5173"
echo "  SCCU API:   http://localhost:3001"
echo "  OBP API:    http://localhost:8080"
echo "  API docs:   http://localhost:3001/docs"
