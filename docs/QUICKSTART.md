# Quickstart

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)
- An [Anthropic API key](https://console.anthropic.com) for AI diagram generation

## 2. Install

```bash
git clone <repo-url>
cd scramble-stack
npm install
```

## 3. Configure the backend

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/scramblestack
JWT_SECRET=change-me-to-something-long-and-random
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
```

> **Redis** (`REDIS_URL`) is optional. The backend falls back to an in-memory cache if not set.

## 4. Set up the database

```bash
cd backend
npx prisma db push     # creates tables from schema
npx prisma generate    # regenerates the Prisma client
```

## 5. Start the servers

In two terminals (or use a process manager):

```bash
# Terminal 1 — backend API (http://localhost:3000)
npm run dev:backend

# Terminal 2 — frontend dev server (http://localhost:5173)
npm run dev:frontend
```

Open http://localhost:5173/canvas.

## 6. Verify

```bash
curl http://localhost:3000/health
# → {"status":"ok"}
```

## Common issues

**`DATABASE_URL not set`** — make sure `backend/.env` exists and is sourced (the backend uses `dotenv` automatically).

**Prisma client out of date** — run `cd backend && npx prisma generate` after any schema change.

**`ANTHROPIC_API_KEY` missing** — the backend will start but AI generation will fail with a 500. Set the key and restart.

**CORS error in the browser** — check that `FRONTEND_URL` in `backend/.env` matches the origin the frontend is running on.
