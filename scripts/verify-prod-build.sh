#!/usr/bin/env bash
# Build every deployable workspace exactly the way Railway/Vercel will, and
# assert each backend's `start` script resolves to a real file. Catches the
# class of bug where `npm test` and `tsc --noEmit` pass but `npm start` (the
# command Railway actually runs in production) crashes on boot.
#
# Why this exists: in 2026-04 we shipped two backends whose `start` script
# pointed to `dist/backend/src/index.js`, but tsc actually emitted to
# `dist/apps/<app>/backend/src/index.js` because of `rootDir: "../../.."`.
# Lint and unit tests were green; only Railway's production container
# discovered the broken path.
#
# Usage:
#   scripts/verify-prod-build.sh
#
# Exits non-zero on the first failing build or unresolvable start path.
set -euo pipefail

cd "$(dirname "$0")/.."

# Same dummy URLs CI sets so Prisma client generation doesn't fail on missing
# env vars. Never overwrites anything you set in your shell.
export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost/ci}"
export NEWS_DATABASE_URL="${NEWS_DATABASE_URL:-file:./ci.db}"

step() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; }

BACKENDS=(
  apps/canvas/backend
  apps/news-feed/backend
  apps/system-design-qa/backend
)
FRONTENDS=(
  apps/canvas/frontend
  apps/news-feed/frontend
  apps/system-design-qa/frontend
)

for ws in "${BACKENDS[@]}" "${FRONTENDS[@]}"; do
  step "build: $ws"
  npm run build --workspace="$ws"
done

# Verify each backend's `start` script points to a file that actually exists
# after the build. Catches `start: node dist/<wrong-path>/index.js`.
for ws in "${BACKENDS[@]}"; do
  step "verify start path: $ws"
  start_script=$(node -e "console.log(require('./$ws/package.json').scripts.start || '')")
  if [ -z "$start_script" ]; then
    fail "$ws has no \"start\" script"
    exit 1
  fi
  # `start` looks like `node dist/<path>/index.js [args...]` — extract the JS path.
  entry=$(printf '%s\n' "$start_script" | awk '{for(i=1;i<=NF;i++) if($i ~ /\.js$/){print $i; exit}}')
  if [ -z "$entry" ]; then
    fail "$ws: could not parse a .js entry out of start script: $start_script"
    exit 1
  fi
  if [ ! -f "$ws/$entry" ]; then
    fail "$ws: \"start\" points to $entry but $ws/$entry does not exist after build"
    fail "       most likely cause: tsc rootDir vs start path drift — check tsconfig.json outDir+rootDir vs package.json start"
    exit 1
  fi
  ok "$ws: start -> $entry exists"
done

ok "all production builds emit the files their start scripts expect"
