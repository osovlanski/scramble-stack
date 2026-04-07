# ScrambleStack

A Miro-like system design canvas. Drag-and-drop architecture nodes, connect them with edges, generate diagrams from natural language via Claude AI, and export as JSON/PNG/SVG.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Flow v12, TypeScript, Vite, Tailwind |
| Backend | Express, Prisma 7, TypeScript, PostgreSQL |
| AI | Anthropic Claude (SSE streaming) |
| Auth | JWT (Bearer token) |
| Cache | In-memory + optional Redis |
| Deploy | Vercel (frontend) + Railway (backend) |

## Local Development

**Prerequisites:** Node 18+, PostgreSQL, (optional) Redis

```bash
# Install all workspaces
npm install

# Set up backend env
cp .env.example backend/.env
# Fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY

# Push schema to database
cd backend && npx prisma db push

# Start both servers
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:5173
```

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for a step-by-step walkthrough.

## Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deployment

CI/CD runs on every push to `main`:
- **Frontend** → Vercel (auto-build via `vite build`)
- **Backend** → Railway (auto-deploy via `railway up`)

Required secrets in GitHub Actions: `RAILWAY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
