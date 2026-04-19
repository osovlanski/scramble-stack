# ScrambleStack

A monorepo containing three engineering practice applications, all accessible from a single hub page.

| App | Description | Port |
|---|---|---|
| **Canvas** | Miro-like diagram editor — drag-and-drop architecture nodes, AI generation, export | 5173 |
| **News Feed** | System design news feed reader with AI-curated articles | 5174 |
| **System Design Q&A** | Interview prep — question library, mock interviews, AI scoring | 5175 |

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Canvas backend | Express, Prisma 7, PostgreSQL, JWT auth |
| News Feed backend | Express, Prisma (SQLite), Anthropic Claude |
| System Design backend | Express, Prisma (SQLite), Anthropic Claude |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Deploy | Vercel (frontends) + Railway (backends) |

## Quick Start

```bash
git clone <repo-url>
cd scramble-stack
npm install
```

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for per-app setup.

## Running locally

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev:all     # bootstraps .env files, boots postgres + redis, runs prisma, starts all 6 processes
```

Open http://localhost:5173 — the hub page shows all three apps. Apps without their `VITE_*_URL` env set show as "Coming soon".

Per-process overrides if you'd rather run them manually:

```bash
npm run dev:infra                       # postgres + redis only
npm run dev:canvas-backend              # http://localhost:3000
npm run dev:canvas-frontend             # http://localhost:5173
npm run dev:news-feed-backend           # http://localhost:3001
npm run dev:news-feed-frontend          # http://localhost:5174
npm run dev:system-design-qa-backend    # http://localhost:3002
npm run dev:system-design-qa-frontend   # http://localhost:5175
```

## Tests

```bash
npm run verify                     # lint + unit tests across every workspace
npm test --workspace=apps/canvas/backend
npm test --workspace=apps/news-feed/backend
npm test --workspace=apps/system-design-qa/backend

# End-to-end (Playwright) — expects the stack to be running
npm run e2e:install                # first time only
npm run e2e

# AI-quality evals (requires ANTHROPIC_API_KEY and running stack)
npm run eval --workspace=evals -- --suite all
```

### Running the CI pipeline locally

`scripts/ci-local.sh` mirrors the `test` + `e2e` jobs from `.github/workflows/deploy.yml`
step-for-step — same lint/test commands, same `docker compose up -d` boot, same
health-check waits, same `npm run e2e`. Run it before pushing to catch what CI would
catch, without waiting on a runner.

```bash
npm run ci:local          # full: lint + unit tests + docker stack + Playwright
npm run ci:local:fast     # lint + unit tests only (no Docker, fastest feedback)
npm run ci:local:e2e      # just boot the stack and run Playwright
```

The script tears down the Docker stack on exit (success or failure) via `trap`.

If your network blocks docker.io (corporate firewall, Harbor whitelist, etc.),
copy the override template and point the image vars at an internal mirror:

```bash
cp .env.ci-local.example .env.ci-local
# edit POSTGRES_IMAGE / REDIS_IMAGE to your mirror, e.g.
#   POSTGRES_IMAGE=harbor-docker.<your-org>/whitelist/postgres:16-alpine
#   REDIS_IMAGE=harbor-docker.<your-org>/whitelist/redis:7
```

`.env.ci-local` is gitignored (matches `.env.*`). `ci-local.sh` sources it before
running `docker compose`. On Apple Silicon some `-alpine` tags aren't multi-arch
on restricted mirrors — fall back to the plain Debian tag (`redis:7`) or pin by
digest. See comments in `.env.ci-local.example` for the full pattern.

## Running the full stack

```bash
# One-command: infra + prisma + 6 dev processes
npm run dev:all

# Smart launcher — picks overmind / mprocs / concurrently (infra must already be up)
npm run dev:smart

# All-in-one via Docker (postgres + redis + 3 backends + 3 frontends)
npm run dev:docker

# Plain npm (fallback)
npm run dev
```

Postgres and Redis pull from Docker Hub by default. On a corporate network that
blocks Docker Hub (e.g. the Payoharbor whitelist), point at an internal mirror:

```bash
POSTGRES_IMAGE=harbor-docker.payoharbor.com/whitelist/postgres:16-alpine \
REDIS_IMAGE=harbor-docker.payoharbor.com/whitelist/redis:7-alpine \
npm run dev:all
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deployment

CI/CD runs on every push to `main`:
- Canvas frontend → Vercel
- Canvas backend → Railway
- News Feed backend → Railway
- System Design Q&A backend → Railway

Required GitHub secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
