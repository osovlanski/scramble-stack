#!/usr/bin/env bash
# One-command local dev:
#   1. Bootstrap missing .env files from .env.example
#   2. Boot postgres + redis containers (infra only)
#   3. Run prisma generate + db push for every backend
#   4. Hand off to scripts/dev.sh (overmind > mprocs > concurrently) to run the 6 processes
#
# Default images come from Docker Hub. On a corporate network that blocks Docker Hub,
# override with POSTGRES_IMAGE / REDIS_IMAGE pointing at an internal mirror.
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILES=(
  "apps/canvas/backend/.env"
  "apps/canvas/frontend/.env"
  "apps/news-feed/backend/.env"
  "apps/news-feed/frontend/.env"
  "apps/system-design-qa/backend/.env"
  "apps/system-design-qa/frontend/.env"
)

echo "→ Bootstrapping .env files"
for env_path in "${ENV_FILES[@]}"; do
  example="${env_path}.example"
  if [ ! -f "$env_path" ] && [ -f "$example" ]; then
    cp "$example" "$env_path"
    echo "   created $env_path from $example"
  fi
done

if ! command -v docker >/dev/null 2>&1; then
  echo "✗ docker not found. Install Docker Desktop, or set DATABASE_URL to a hosted Postgres and skip this script." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker daemon is not running. Start Docker Desktop and retry." >&2
  exit 1
fi

echo "→ Starting postgres + redis via docker-compose"
docker compose up -d postgres redis

echo "→ Waiting for postgres to report healthy"
for i in {1..30}; do
  status=$(docker inspect --format='{{.State.Health.Status}}' scramble-postgres 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    echo "   postgres healthy"
    break
  fi
  sleep 1
  if [ "$i" = "30" ]; then
    echo "✗ postgres did not become healthy in 30s" >&2
    docker compose logs postgres | tail -20 >&2
    exit 1
  fi
done

echo "→ Running prisma generate + db push for each backend"
npm run db:generate --workspace=apps/canvas/backend
npm run db:push --workspace=apps/canvas/backend

# news-feed + qa use SQLite; db push is cheap and idempotent
(cd apps/news-feed/backend && npx prisma db push --accept-data-loss --skip-generate >/dev/null && npx prisma generate >/dev/null)
(cd apps/system-design-qa/backend && npx prisma db push --accept-data-loss --skip-generate >/dev/null && npx prisma generate >/dev/null)

echo "→ Handing off to scripts/dev.sh for 6-process dev loop"
exec "$(dirname "$0")/dev.sh"
