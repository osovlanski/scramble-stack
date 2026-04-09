# App C — System Design Q&A: Design Spec

**Date:** 2026-04-09
**Status:** Approved
**Scope:** New `apps/system-design-qa/` workspace — question library, interactive sessions, Claude scoring, Canvas integration

---

## Overview

App C is a system design practice tool. It combines a searchable question library (seeded + AI-generated) with three interactive session modes: structured answer, mock interview, and timed graded submission. Answers can include a Canvas diagram attached by ID. Claude scores submissions across five dimensions and reveals a model answer after submission.

The app follows the established monorepo pattern (`apps/system-design-qa/backend` + `apps/system-design-qa/frontend`) and integrates with App A (Canvas) via a single export endpoint.

---

## Architecture

```
apps/system-design-qa/
  backend/     — Express + Prisma (SQLite) + Claude   port 3002
  frontend/    — Vite + React + Tailwind              port 5175
```

### Data Flow

```
── QUESTION LIBRARY ──────────────────────────────────────────
questions.seed.ts → seeded on first run → DB
POST /api/questions/generate → Claude → DB (isAiGenerated: true)

── SESSION ───────────────────────────────────────────────────
POST /api/sessions → new Session (mode: structured|interview|graded)

  structured / graded:
    user writes text answer + optional canvasDiagramId
    POST /submit → App C backend fetches diagram from Canvas backend
                 → Claude scores → score + feedback stored

  interview:
    POST /message turns (user ↔ Claude clarifications)
    POST /submit → full conversation + answer + optional diagram
                 → Claude scores → score + feedback stored

── CANVAS INTEGRATION ────────────────────────────────────────
Canvas backend: GET /api/diagrams/:id/export → { name, nodes, edges }
App C backend calls this URL when a canvasDiagramId is attached to a submission.
The diagram is serialised as a component list for the scoring prompt.

── SCORING (all modes) ───────────────────────────────────────
Claude prompt includes: question, answer text, diagram (if any),
interview transcript (if interview mode)

5 dimensions × 20 pts = 100 pts total:
  scalability     — load handling, horizontal scaling, bottlenecks
  data model      — schema, storage choices, indexing
  component design — services, APIs, separation of concerns
  reliability     — fault tolerance, retries, failure modes
  tradeoffs       — explicit CAP/consistency/latency tradeoffs

Response: score (0–100), breakdown (per dimension), strengths (text),
          gaps (text), modelAnswer (revealed only post-submission)
```

---

## Data Models

### Question

```prisma
model Question {
  id            String    @id @default(cuid())
  title         String
  company       String?
  genre         String    // distributed-systems | storage | messaging | search |
                          // feed | payments | notifications | cdn | rate-limiting
  difficulty    String    // easy | medium | hard
  description   String
  hints         String    // JSON array of hint strings
  modelAnswer   String
  isAiGenerated Boolean   @default(false)
  createdAt     DateTime  @default(now())
  sessions      Session[]
}
```

### Session

```prisma
model Session {
  id              String    @id @default(cuid())
  questionId      String
  question        Question  @relation(fields: [questionId], references: [id])
  mode            String    // structured | interview | graded
  status          String    // in_progress | submitted | scored
  messages        String    // JSON: [{ role: 'user'|'assistant', content: string }]
  textAnswer      String?
  canvasDiagramId String?
  score           Int?
  feedback        String?   // JSON: { breakdown, strengths, gaps }
  createdAt       DateTime  @default(now())
}
```

---

## Question Library

### Seeded questions (`questions.seed.ts`) — 20 questions

| Company | Title | Genre | Difficulty |
|---|---|---|---|
| Twitter/X | Design the Twitter feed | feed | hard |
| Uber | Design Uber's dispatch system | distributed-systems | hard |
| Netflix | Design Netflix's CDN | cdn | hard |
| WhatsApp | Design WhatsApp messaging | messaging | medium |
| Amazon | Design Amazon's product search | search | medium |
| Google | Design Google Docs (collaborative editing) | storage | hard |
| Airbnb | Design Airbnb's booking system | payments | medium |
| LinkedIn | Design LinkedIn's news feed | feed | medium |
| Dropbox | Design Dropbox file sync | storage | medium |
| Slack | Design Slack's real-time messaging | messaging | hard |
| YouTube | Design YouTube's video upload pipeline | cdn | hard |
| Instagram | Design Instagram's photo storage | storage | medium |
| Stripe | Design a payment processing system | payments | hard |
| Discord | Design Discord's voice channels | distributed-systems | hard |
| TikTok | Design TikTok's recommendation engine | feed | hard |
| — | Design a URL shortener | rate-limiting | easy |
| — | Design a rate limiter | rate-limiting | easy |
| — | Design a distributed cache | distributed-systems | medium |
| — | Design a push notification system | notifications | medium |
| — | Design a leaderboard | storage | easy |

### AI Generation

`POST /api/questions/generate` body: `{ company?, genre, difficulty }`

Claude generates: title, description, hints (3–5 bullet points), modelAnswer. Saved with `isAiGenerated: true`. Appears in the library immediately and is searchable.

### Future: Scheduled Question Refresh

Not in scope for v1. The `company` and `genre` fields on `Question` are designed to support it without schema changes.

Planned enhancement: a weekly cron that iterates a `Company` table (name, industry, techStack) and generates 1–2 new questions per company when fewer than N exist for that company. A `staleness` flag will mark questions older than 6 months for review. This follows the same scheduler pattern as App B (News Feed) and should be built once real usage data shows which companies and genres are most in demand.

---

## API

```
GET  /health
GET  /api/questions              ?company=&genre=&difficulty=&q=
GET  /api/questions/:id
POST /api/questions/generate     { company?, genre, difficulty }

POST /api/sessions               { questionId, mode }
                                 — for interview mode: immediately calls Claude to
                                   generate opening clarifying question, stored as
                                   first message with role 'assistant'
GET  /api/sessions/:id
POST /api/sessions/:id/message   { content }          — interview mode only
POST /api/sessions/:id/submit    { textAnswer, canvasDiagramId? }
GET  /api/sessions/:id/result    — score + feedback + modelAnswer (only if scored)
```

### Canvas export endpoint (added to Canvas backend)

```
GET /api/diagrams/:id/export
→ { id, name, nodes: [{ id, type, data }], edges: [{ source, target, label? }] }
```

---

## Session Modes

### Structured Answer
1. User reads question + hints
2. Writes free-form text answer
3. Optionally attaches a Canvas diagram by ID
4. Submits → Claude scores → result page

### Mock Interview
1. Claude opens with 3–4 clarifying questions (scale, SLA, read/write ratio, constraints)
2. User answers each in a chat interface
3. After clarifications, Claude prompts "Go ahead and design the system"
4. User writes final answer + optional diagram
5. Submits → Claude scores using full transcript → result page

### Graded (Timed)
1. 45-minute countdown (default, configurable via env `GRADED_TIMEOUT_MINUTES`)
2. Timer lives in frontend only — self-discipline, not server-enforced
3. Same submit flow as structured answer
4. Result page shows time taken

---

## Frontend Pages

| Route | Page |
|---|---|
| `/` | Question library — filter chips (genre, difficulty) + company search + question cards |
| `/questions/:id` | Question detail — description, hints (toggle), mode selector, Start Session |
| `/sessions/:id` | Active session — mode-specific UI (chat for interview, editor + timer for graded) |
| `/sessions/:id/result` | Result — score ring, dimension breakdown, strengths/gaps, model answer reveal, Try Again |

---

## Hub & Sidebar Integration

- `HubPage.tsx` — new "System Design Q&A" tile, gated on `VITE_SYSTEM_DESIGN_URL`
- `AppSidebar.tsx` — new icon (e.g. `BrainCircuit` from lucide-react), same disabled/active pattern

### New env vars

**Canvas frontend** (`apps/canvas/frontend/.env`):
- `VITE_SYSTEM_DESIGN_URL` — URL of deployed System Design Q&A frontend

**System Design backend** (`apps/system-design-qa/backend/.env`):
- `ANTHROPIC_API_KEY` — required
- `CANVAS_BACKEND_URL` — URL of Canvas backend for diagram export (default: `http://localhost:3000`)
- `PORT` — default `3002`
- `GRADED_TIMEOUT_MINUTES` — default `45`

---

## CI/CD

Two new jobs added to `.github/workflows/deploy.yml`:

```yaml
- name: System Design backend — typecheck
  run: npm run lint --workspace=apps/system-design-qa/backend
- name: System Design backend — tests
  run: npm test --workspace=apps/system-design-qa/backend

deploy-system-design-qa-backend:
  name: Deploy System Design Backend (Railway)
  needs: test
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  steps:
    - run: railway up --service=system-design-qa-backend --detach
      working-directory: apps/system-design-qa/backend
```

---

## Error Handling

- Canvas export call fails (Canvas backend down) → proceed with text-only scoring, note "diagram unavailable" in prompt
- Claude scoring fails → session stays `submitted`, retry via `GET /sessions/:id/result` which re-triggers scoring if not yet scored
- AI question generation fails → 500 with message, no partial record saved
- Interview message to non-`in_progress` session → 400

---

## Testing

- Unit tests for scoring prompt builder (verify dimensions + diagram serialisation)
- Unit tests for question search (filter combinations)
- Unit tests for session state machine (invalid transitions return 400)
- Mock `claudeChat` and Canvas export HTTP call in all tests
