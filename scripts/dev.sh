#!/usr/bin/env bash
set -euo pipefail

# Pick the best available process manager for local dev.
# Preference order: overmind > mprocs > docker > concurrently.

cd "$(dirname "$0")/.."

if command -v overmind >/dev/null 2>&1; then
  echo "→ Starting with overmind (Procfile.dev)"
  OVERMIND_PROCFILE=Procfile.dev exec overmind start
elif command -v mprocs >/dev/null 2>&1; then
  echo "→ Starting with mprocs (Procfile.dev)"
  exec mprocs --config Procfile.dev
elif command -v docker >/dev/null 2>&1 && [ -f docker-compose.yml ] && [ "${USE_DOCKER:-0}" = "1" ]; then
  echo "→ Starting with docker compose"
  exec docker compose up
else
  echo "→ Falling back to concurrently"
  exec npm run dev
fi
