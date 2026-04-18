# Quickstart

## 1. Prerequisites

- Node.js 22.12+ (Prisma 7 requires it)
- Docker Desktop (runs Postgres + Redis for canvas backend)
- An [Anthropic API key](https://console.anthropic.com) — required by all three backends

> News Feed and System Design Q&A backends use SQLite — no separate DB setup needed.

## 2. One-command start

```bash
git clone <repo-url>
cd scramble-stack
npm install

export ANTHROPIC_API_KEY=sk-ant-...
npm run dev:all
```

`dev:all` will:
1. Copy every `apps/*/.env.example` into `.env` if missing.
2. Boot `postgres` + `redis` containers (images pull from Docker Hub by default; override `POSTGRES_IMAGE` / `REDIS_IMAGE` with an internal mirror on restricted networks).
3. Run `prisma generate` + `prisma db push` for all 3 backends.
4. Launch all 6 dev processes via overmind (falls back to mprocs, then concurrently).

Open <http://localhost:5173> when the boot output settles.

## 3. Manual alternative

If you'd rather drive each piece yourself:

```bash
npm install
npm run dev:infra            # starts postgres + redis only
npm run dev:smart            # starts the 6 processes

```

## 4. Environment reference

`dev:all` seeds these from `.env.example`. Edit the generated `.env` files if your setup diverges.

### Canvas backend (`apps/canvas/backend/.env`)

```env
DATABASE_URL=postgresql://scramble:scramble@localhost:5432/scramble
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-to-something-long-and-random
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
PORT=3000
```

> Both values match the services spun up by `npm run dev:infra`. Redis falls back to the in-memory layer if unreachable.

```bash
cd apps/canvas/backend
npx prisma db push
npx prisma generate
```

### News Feed backend (`apps/news-feed/backend/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

```bash
cd apps/news-feed/backend
npx prisma db push
```

### System Design Q&A backend (`apps/system-design-qa/backend/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-...
CANVAS_BACKEND_URL=http://localhost:3000
PORT=3002
GRADED_TIMEOUT_MINUTES=45
```

```bash
cd apps/system-design-qa/backend
npx prisma db push
```

### Canvas frontend (`apps/canvas/frontend/.env`)

```env
VITE_NEWS_FEED_URL=http://localhost:5174
VITE_SYSTEM_DESIGN_URL=http://localhost:5175
```

> Without these, the hub page shows News Feed and System Design Q&A as "Coming soon".

## 5. Starting servers individually

If you need to run just one process:

```bash
npm run dev:canvas-backend       # http://localhost:3000
npm run dev:canvas-frontend      # http://localhost:5173  ← hub
npm run dev:news-feed-backend    # http://localhost:3001
npm run dev:news-feed-frontend   # http://localhost:5174
npm run dev:system-design-qa-backend    # http://localhost:3002
npm run dev:system-design-qa-frontend   # http://localhost:5175
```

## 6. Verify

```bash
curl http://localhost:3000/health   # Canvas backend
curl http://localhost:3001/health   # News Feed backend
curl http://localhost:3002/health   # System Design Q&A backend
# All → {"status":"ok"}
```

## Common issues

**Canvas: `DATABASE_URL not set`** — ensure `apps/canvas/backend/.env` exists and has the correct Postgres URL.

**Prisma client out of date** — run `npx prisma generate` inside the relevant backend after any schema change.

**`ANTHROPIC_API_KEY` missing** — backend starts but AI features return 500. Set the key and restart.

**Hub shows apps as "Coming soon"** — set `VITE_NEWS_FEED_URL` and/or `VITE_SYSTEM_DESIGN_URL` in `apps/canvas/frontend/.env`.

**System Design Q&A: SQLite file not found** — run `npx prisma db push` in `apps/system-design-qa/backend/`. The database is auto-created on first push.

**Canvas CORS error** — ensure `FRONTEND_URL` in Canvas backend `.env` matches `http://localhost:5173`.

**Postgres/Redis container pull fails** — defaults pull `postgres:16-alpine` and `redis:7-alpine` from Docker Hub. If your network blocks Docker Hub, point at an internal mirror, e.g. `POSTGRES_IMAGE=harbor-docker.payoneer.com/whitelist/postgres:16-alpine REDIS_IMAGE=harbor-docker.payoneer.com/whitelist/redis:7-alpine npm run dev:all` (verify the tags exist on the mirror first — not every version is whitelisted).

**Canvas P1017 "Server has closed the connection"** — usually means `DATABASE_URL` points at a hosted pooler (e.g. Railway) that dropped an idle connection. Switch to local Postgres via `npm run dev:infra` or shorten your pool's idle timeout.
