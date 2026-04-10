# Quickstart

## 1. Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) — required by all three backends

Canvas backend also requires:
- PostgreSQL 14+ (local or hosted)

News Feed and System Design Q&A backends use SQLite — no separate DB setup needed.

## 2. Install

```bash
git clone <repo-url>
cd scramble-stack
npm install
```

## 3. Configure environments

### Canvas backend (`apps/canvas/backend/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/scramblestack
JWT_SECRET=change-me-to-something-long-and-random
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
PORT=3000
```

> **Redis** (`REDIS_URL`) is optional — falls back to in-memory cache.

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

## 4. Start the servers

Open five terminals (or use a process manager like `tmux`):

```bash
# Terminal 1
npm run dev:canvas-backend       # http://localhost:3000

# Terminal 2
npm run dev:canvas-frontend      # http://localhost:5173  ← open this

# Terminal 3 (optional)
npm run dev:news-feed-backend    # http://localhost:3001

# Terminal 4 (optional)
npm run dev:news-feed-frontend   # http://localhost:5174

# Terminal 5 (optional)
npm run dev:system-design-qa-backend    # http://localhost:3002

# Terminal 6 (optional)
npm run dev:system-design-qa-frontend   # http://localhost:5175
```

Open http://localhost:5173 — the hub page is the landing page for all apps.

## 5. Verify

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
