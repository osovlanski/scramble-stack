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
# Canvas (hub + diagram editor)
npm run dev:canvas-backend    # http://localhost:3000
npm run dev:canvas-frontend   # http://localhost:5173  ← open this

# News Feed
npm run dev:news-feed-backend   # http://localhost:3001
npm run dev:news-feed-frontend  # http://localhost:5174

# System Design Q&A
npm run dev:system-design-qa-backend    # http://localhost:3002
npm run dev:system-design-qa-frontend   # http://localhost:5175
```

Open http://localhost:5173 — the hub page shows all three apps. Apps without their `VITE_*_URL` env set show as "Coming soon".

## Tests

```bash
npm test --workspace=apps/canvas/backend
npm test --workspace=apps/news-feed/backend
npm test --workspace=apps/system-design-qa/backend
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
