# Architecture

## Overview

ScrambleStack is a Node.js monorepo (`npm workspaces`) with three independent apps, each with a backend and frontend workspace:

```
scramble-stack/
├── apps/
│   ├── canvas/
│   │   ├── backend/     Express + Prisma (PostgreSQL) + Claude   port 3000
│   │   └── frontend/    Vite + React + Tailwind                  port 5173
│   ├── news-feed/
│   │   ├── backend/     Express + Prisma (SQLite) + Claude       port 3001
│   │   └── frontend/    Vite + React + Tailwind                  port 5174
│   └── system-design-qa/
│       ├── backend/     Express + Prisma (SQLite) + Claude       port 3002
│       └── frontend/    Vite + React + Tailwind                  port 5175
└── package.json         workspace root ("apps/*/*")
```

The Canvas frontend is the **hub** — it serves a landing page (`/`) showing all three apps as tiles. The sidebar (`AppSidebar`) provides persistent cross-app navigation.

---

## App A — Canvas (`apps/canvas/`)

### Backend

```
src/
├── index.ts                   # Express entry point
├── core/
│   ├── databaseService.ts     # Prisma client (PrismaPg adapter for PostgreSQL)
│   ├── claudeService.ts       # Anthropic SDK — generates diagram JSON via SSE
│   ├── cacheService.ts        # Two-layer cache: NodeCache (memory) + Redis (optional)
│   ├── configService.ts       # Typed config from env vars
│   └── logger.ts              # Winston logger
├── middleware/
│   └── authMiddleware.ts      # JWT Bearer verification
└── canvas/
    ├── routes.ts              # All /api/diagrams/* routes + public /export
    ├── canvasController.ts    # Request handlers
    └── services/
        ├── diagramService.ts         # CRUD + auto-versioning (snapshot every 10 saves)
        ├── aiGeneratorService.ts     # Calls Claude, sanitises node types
        ├── exportService.ts          # JSON export
        └── customNodeTypeService.ts
```

**Database:** PostgreSQL via Prisma. Models: `User`, `Diagram`, `DiagramVersion`, `CustomNodeType`.

**Public endpoint:** `GET /api/diagrams/:id/export` — called by the System Design Q&A backend when scoring submissions with an attached diagram. No auth required.

**AI generation (SSE):** Client POSTs to `/api/canvas/generate`. Backend streams `meta`, `node`, `edge`, `done` events as Claude responds.

### Frontend

```
src/
├── App.tsx               # Routes: / (HubPage), /canvas/:id, auth pages
├── AppLayout.tsx         # Persistent sidebar wrapper (React Router Outlet)
├── AppSidebar.tsx        # 48px icon rail — Canvas, News Feed, System Design Q&A links
├── HubPage.tsx           # Landing page with app tiles
└── canvas/
    ├── Board/            # ReactFlow canvas, SVG draw overlay
    ├── DiagramList/      # CRUD list view
    ├── Toolbar/          # Save, undo/redo, export, versions
    ├── AIGenerator/      # SSE streaming panel
    ├── NodeTypes/        # 24 node type components
    └── Palette/          # Draggable node palette
```

All pages share `AppLayout` which renders `AppSidebar` on the left. Hub tiles link to other apps by `VITE_NEWS_FEED_URL` / `VITE_SYSTEM_DESIGN_URL` (if unset, shown as "Coming soon").

---

## App B — News Feed (`apps/news-feed/`)

Fetches and summarizes system design news via Claude. Backend uses SQLite for article caching. Not described in detail here.

---

## App C — System Design Q&A (`apps/system-design-qa/`)

### Data flow

```
── QUESTION LIBRARY ──────────────────────────────────────────
questions.seed.ts → seeded on first run → SQLite DB
POST /api/questions/generate → Claude → DB (isAiGenerated: true)

── SESSION ───────────────────────────────────────────────────
POST /api/sessions → new Session (mode: structured|interview|graded)

  structured / graded:
    user writes text answer + optional canvasDiagramId
    POST /submit → fetches diagram from Canvas backend (if attached)
                 → Claude scores → score + feedback stored

  interview:
    POST /message turns (user ↔ Claude clarifications)
    POST /submit → full conversation + answer + optional diagram
                 → Claude scores → score + feedback stored

── SCORING ───────────────────────────────────────────────────
5 dimensions × 20 pts = 100 pts total:
  scalability, data_model, component_design, reliability, tradeoffs
```

### Backend

```
src/
├── db.ts                       # Prisma singleton (globalThis pattern)
├── claude.ts                   # claudeChat + claudeConverse wrappers
├── index.ts                    # Express app, CORS, seeder on startup
├── api/routes.ts               # All routes
├── questions/
│   ├── questions.seed.ts       # 20 seeded questions with model answers
│   ├── seeder.ts               # Seeds DB if empty on startup
│   ├── questionController.ts   # GET /questions, GET /questions/:id
│   ├── generateController.ts   # POST /questions/generate
│   └── questionGenerator.ts   # Claude-based question generation
└── sessions/
    ├── interviewService.ts     # Opening question + back-and-forth turns
    ├── diagramFetcher.ts       # HTTP call to Canvas backend export endpoint
    ├── scoringService.ts       # 5-dimension Claude scoring
    └── sessionController.ts   # POST /sessions, /message, /submit, GET /result
```

### Frontend (`apps/system-design-qa/frontend/`)

```
src/
├── App.tsx          # Routes: / (LibraryPage), /questions/:id, /sessions/:id, /sessions/:id/result
├── api.ts           # Axios client wrapping all backend calls
├── types.ts         # Question, Session, SessionResult, ScoreBreakdown interfaces
├── Library/
│   ├── LibraryPage.tsx    # Filter chips + question grid + AI generator panel
│   ├── FilterBar.tsx      # Genre + difficulty + company search filters
│   └── QuestionCard.tsx   # Clickable card navigating to question detail
├── Question/
│   └── QuestionPage.tsx   # Description, hints toggle, mode selector, Start Session
├── Session/
│   ├── SessionPage.tsx    # Mode router — picks StructuredEditor/GradedEditor/InterviewChat
│   ├── StructuredEditor.tsx  # Free-text answer + optional diagram ID
│   ├── GradedEditor.tsx      # Same as structured + 45-min countdown timer
│   └── InterviewChat.tsx     # Chat bubbles, send-on-Enter, submit design phase
└── Result/
    └── ResultPage.tsx    # Score ring, dimension bars, strengths/gaps, model answer reveal
```

---

## Deployment

| Service | Platform | Trigger |
|---|---|---|
| Canvas frontend | Vercel | Push to `main` |
| Canvas backend | Railway | Push to `main` |
| News Feed backend | Railway | Push to `main` |
| System Design Q&A backend | Railway | Push to `main` |

### Environment variables

**Canvas backend:**
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | JWT signing secret |
| `ANTHROPIC_API_KEY` | yes | Claude API key |
| `FRONTEND_URL` | yes | Allowed CORS origin |
| `REDIS_URL` | no | Falls back to memory cache |
| `PORT` | no | Default `3000` |

**Canvas frontend:**
| Variable | Required | Description |
|---|---|---|
| `VITE_NEWS_FEED_URL` | no | URL of deployed News Feed frontend |
| `VITE_SYSTEM_DESIGN_URL` | no | URL of deployed System Design Q&A frontend |

**System Design Q&A backend:**
| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Claude API key |
| `CANVAS_BACKEND_URL` | no | Canvas backend URL (default `http://localhost:3000`) |
| `PORT` | no | Default `3002` |
| `GRADED_TIMEOUT_MINUTES` | no | Default `45` |
