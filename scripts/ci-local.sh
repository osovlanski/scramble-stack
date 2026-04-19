#!/usr/bin/env bash
# Mirror of .github/workflows/deploy.yml (test + e2e jobs) — run locally on demand
# before pushing, so CI surprises are rare.
#
# Usage:
#   scripts/ci-local.sh              # full run: lint + unit tests + docker-stack e2e
#   scripts/ci-local.sh --skip-e2e   # lint + unit tests only (fast feedback loop)
#   scripts/ci-local.sh --e2e-only   # just boot the stack and run Playwright
#
# Exits non-zero on the first failing step. Always runs `docker compose down -v`
# at the end if the stack was started, even on failure (via trap).
set -euo pipefail

cd "$(dirname "$0")/.."

SKIP_E2E=false
E2E_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --skip-e2e) SKIP_E2E=true ;;
    --e2e-only) E2E_ONLY=true ;;
    -h|--help)
      sed -n '2,10p' "$0"
      exit 0
      ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# Same dummy URLs CI sets so Prisma client generation during `npm ci` doesn't fail
# on missing env vars. Never overwrites anything you set in your shell.
export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost/ci}"
export NEWS_DATABASE_URL="${NEWS_DATABASE_URL:-file:./ci.db}"

# Match CI so local runs pull the same images; still overridable from your env.
export POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
export REDIS_IMAGE="${REDIS_IMAGE:-redis:7-alpine}"
export CANVAS_URL="${CANVAS_URL:-http://localhost:5173}"
export NEWS_FEED_URL="${NEWS_FEED_URL:-http://localhost:5174}"
export QA_URL="${QA_URL:-http://localhost:5175}"

step() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; }

run_test_job() {
  step "test — lint + unit tests across every workspace (mirrors CI 'test' job)"

  local workspaces_lint=(
    apps/canvas/backend
    apps/canvas/frontend
    apps/news-feed/backend
    apps/news-feed/frontend
    apps/system-design-qa/backend
  )
  local workspaces_test=(
    apps/canvas/backend
    apps/canvas/frontend
    apps/news-feed/backend
    apps/system-design-qa/backend
  )

  for ws in "${workspaces_lint[@]}"; do
    step "lint: $ws"
    npm run lint --workspace="$ws"
  done

  for ws in "${workspaces_test[@]}"; do
    step "test: $ws"
    npm test --workspace="$ws"
  done

  ok "test job passed"
}

stack_up=false

teardown() {
  if [ "$stack_up" = true ]; then
    step "tear down docker stack (always runs)"
    docker compose logs --no-color > docker.log 2>&1 || true
    docker compose down -v || true
  fi
}
trap teardown EXIT

wait_for_port() {
  local port="$1"
  local label="$2"
  for _ in {1..60}; do
    if curl -sf "http://localhost:${port}${label}" >/dev/null; then
      echo "   port $port ready"
      return 0
    fi
    sleep 2
  done
  fail "nothing listening on port $port after 120s"
  docker compose logs --no-color | tail -120 >&2
  return 1
}

run_e2e_job() {
  step "e2e — boot docker stack + run Playwright (mirrors CI 'e2e' job)"

  if ! command -v docker >/dev/null 2>&1; then
    fail "docker is required for the e2e job. Start Docker Desktop or pass --skip-e2e."
    exit 1
  fi

  step "install Playwright browsers (idempotent)"
  npm run e2e:install

  step "docker compose up -d"
  docker compose up -d
  stack_up=true

  step "wait for backend health endpoints (3000, 3001, 3002)"
  for port in 3000 3001 3002; do
    wait_for_port "$port" "/health"
  done

  step "wait for frontends (5173, 5174, 5175)"
  for port in 5173 5174 5175; do
    wait_for_port "$port" "/"
  done

  step "npm run e2e"
  npm run e2e

  ok "e2e job passed"
}

if [ "$E2E_ONLY" = true ]; then
  run_e2e_job
  ok "ci-local (e2e only) passed"
  exit 0
fi

run_test_job

if [ "$SKIP_E2E" = true ]; then
  ok "ci-local (test only) passed — skipped e2e"
  exit 0
fi

run_e2e_job
ok "ci-local passed — safe to push"
