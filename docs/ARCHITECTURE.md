# Architecture

## Overview

ScrambleStack is a monorepo with three npm workspaces:

```
scramble-stack/
├── shared/          # TypeScript types shared between frontend and backend
├── backend/         # Express API
└── frontend/        # React SPA
```

---

## Backend (`backend/`)

```
src/
├── index.ts                   # Express entry point, env validation, server start
├── core/
│   ├── databaseService.ts     # Prisma client initialisation (PrismaPg adapter)
│   ├── claudeService.ts       # Anthropic SDK wrapper — generates diagram JSON
│   ├── cacheService.ts        # Two-layer cache: NodeCache (memory) + Redis (optional)
│   ├── configService.ts       # Typed config with env-var overrides
│   └── logger.ts              # Winston logger with canvas/db/ai prefixes
├── middleware/
│   └── authMiddleware.ts      # JWT Bearer verification; sets req.userId
└── canvas/
    ├── routes.ts              # All /api/canvas/* routes; applies authMiddleware
    ├── canvasController.ts    # Request/response handling for all canvas endpoints
    └── services/
        ├── diagramService.ts      # CRUD + auto-versioning (snapshot every 10 saves, max 20)
        ├── aiGeneratorService.ts  # Calls claudeService, sanitises node types
        ├── exportService.ts       # JSON export (strips thumbnail from meta)
        └── customNodeTypeService.ts
```

### Database schema (Prisma)

| Model | Key fields |
|---|---|
| `User` | id, email, name |
| `Diagram` | id, userId, name, nodes (Json), edges (Json), viewport (Json?), saveCount |
| `DiagramVersion` | id, diagramId, version, nodes (Json), edges (Json) |
| `CustomNodeType` | id, userId, name, iconSvg, color, description |

Versioning: on every 10th save (`saveCount % 10 === 0`), the service snapshots nodes+edges into `DiagramVersion`. When the count exceeds 20, the oldest version is pruned.

### API routes

```
GET    /health

GET    /api/canvas/diagrams
POST   /api/canvas/diagrams
GET    /api/canvas/diagrams/:id
PUT    /api/canvas/diagrams/:id
DELETE /api/canvas/diagrams/:id

GET    /api/canvas/diagrams/:id/versions
POST   /api/canvas/diagrams/:id/versions/:ver/restore

POST   /api/canvas/generate              (SSE stream)
POST   /api/canvas/diagrams/:id/export

GET    /api/canvas/node-types/custom
POST   /api/canvas/node-types/custom
DELETE /api/canvas/node-types/custom/:id
```

All routes except `/health` require `Authorization: Bearer <jwt>`.

### AI generation (SSE)

The client opens a POST to `/api/canvas/generate`. The backend calls Claude, then streams events over SSE:

```
event: meta   — diagram name and description
event: node   — one node (emitted per node with 80ms delay for progressive rendering)
event: edge   — one edge
event: done   — stream complete
event: error  — generation failure
```

The frontend uses `fetch` + `ReadableStream` (not `EventSource`, which is GET-only).

---

## Frontend (`frontend/`)

```
src/
├── main.tsx                  # React root, router setup
├── App.tsx                   # Top-level routes
├── services/
│   └── canvasApi.ts          # Typed fetch wrapper for all backend calls
└── canvas/
    ├── NodeTypes/
    │   ├── index.ts          # NODE_TYPES map (React Flow) + PALETTE_CATEGORIES
    │   └── *.tsx             # One component per node type (24 total)
    ├── Board/
    │   ├── CanvasBoard.tsx   # ReactFlowProvider, drag-drop from palette
    │   └── useCanvas.ts      # State: nodes/edges/viewport, debounced save (1500ms), thumbnail
    ├── Toolbar/
    │   ├── Toolbar.tsx       # Save status, diagram name, undo/redo, export, version history
    │   ├── ExportMenu.tsx
    │   ├── UndoRedoButtons.tsx
    │   └── VersionHistory.tsx
    ├── AIGenerator/
    │   ├── AIGeneratorPanel.tsx
    │   ├── useAIGenerator.ts  # Streams nodes/edges via SSE; AbortController for cancel
    │   └── GenerationProgress.tsx
    ├── DiagramList/
    │   ├── DiagramList.tsx
    │   ├── DiagramCard.tsx
    │   └── useDiagramList.ts  # CRUD + optimistic delete
    └── Palette/
        └── Palette.tsx        # Sidebar with draggable node categories
```

### State flow

```
DiagramList → navigate to /canvas/:id
  → useCanvas loads diagram (getDiagram)
  → nodes/edges managed by React Flow (useNodesState / useEdgesState)
  → every change debounces a save (1500ms) → canvasApi.saveDiagram
  → thumbnail captured via html-to-image before save

AI panel → useAIGenerator.generate(prompt)
  → streams from /api/canvas/generate
  → appends nodes/edges to canvas as they arrive
```

### Shared types (`shared/types.ts`)

Both packages import from `@shared/types` (resolved via tsconfig `paths` on the backend and vite `resolve.alias` on the frontend). This is the single source of truth for:

- `NodeType` union (24 members)
- `DiagramNodeData`, `DiagramNodeRaw`, `DiagramEdgeRaw`
- `DiagramMeta`, `DiagramFull`, `SaveDiagramPayload`
- `DiagramVersionMeta`, `CustomNodeTypeData`
- `GenerateDiagramRequest`, `GenerateDiagramResponse`
- `ApiResponse<T>`

---

## Deployment

| Service | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Push to `main` |
| Backend | Railway | Push to `main` |

See `.github/workflows/deploy.yml` for the CI/CD pipeline.

### Environment variables

**Backend (Railway):**

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Signing secret for JWTs |
| `ANTHROPIC_API_KEY` | yes | Claude API key |
| `FRONTEND_URL` | yes | Allowed CORS origin (Vercel URL) |
| `REDIS_URL` | no | Redis connection string; falls back to memory cache |
| `PORT` | no | Defaults to 3000 |
| `NODE_ENV` | no | Set to `production` |

**Frontend (Vercel):**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no | Backend URL if not using a proxy rewrite |
