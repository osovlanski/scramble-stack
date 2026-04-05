# ScrambleStack — App A: Canvas / Diagram Board

**Date:** 2026-04-05
**Status:** Approved
**Scope:** App A of 3 (Canvas). Apps B (News Feed) and C (System Design Q&A) are separate specs.

---

## 1. Overview

A Miro-like system design canvas built on React Flow. Users drag nodes (microservices, databases, cloud components, etc.) onto a canvas, wire them with edges, and can generate full diagrams from a natural-language AI prompt. Diagrams are auto-saved to PostgreSQL with version history and can be exported as PNG, SVG, or JSON.

---

## 2. Monorepo & Infrastructure Context

ScrambleStack is a monorepo housing 3 independent apps under one Railway backend service and one Vercel frontend deployment.

```
scramble-stack/
├── backend/src/
│   ├── core/          ← reused from pocketknife (claude, db, cache, config, logger)
│   ├── canvas/        ← App A (this spec)
│   ├── news/          ← App B (separate spec)
│   └── practice/      ← App C (separate spec)
├── frontend/src/
│   ├── canvas/        ← App A frontend
│   ├── news/          ← App B frontend
│   └── practice/      ← App C frontend
└── shared/
    └── types.ts       ← shared TypeScript types across all apps
```

**Tech stack:** Node.js 18+ / Express / TypeScript / Prisma / PostgreSQL / Socket.io / React 18 / Vite / Tailwind CSS / Lucide React — all carried over from pocketknife.

**New frontend dependency:** `@xyflow/react ^12.x` (React Flow v12).

---

## 3. Pocketknife Reuse Map

| Pocketknife File | ScrambleStack Treatment |
|---|---|
| `databaseService.ts` | Copy as-is — generic Prisma singleton |
| `logger.ts` | Copy as-is — add `canvas` icon entry |
| `cacheService.ts` | Copy as-is — update `cacheKeys` to ScrambleStack domains |
| `claudeService.ts` | Copy, remove email methods, add `generateDiagram(prompt)` |
| `configService.ts` | Copy framework, replace config keys with `canvas.*` / `news.*` / `practice.*` |
| `googleSearchService.ts` | Copy as-is for App B (news) |
| `components/common/` | Copy as-is (Header, NavTabs, Modal, Button, Toast) |
| `hooks/useAuth.ts` | Copy as-is |
| `@excalidraw/excalidraw` | Already installed — use for freehand/shapes secondary mode |
| `mermaid` | Already installed — use for diagram export rendering |

---

## 4. Architecture

**Option chosen:** Feature-sliced frontend + modular backend (Option B).

```
backend/src/canvas/
├── canvasController.ts       ← route handlers
├── routes.ts                 ← /api/canvas/*
└── services/
    ├── diagramService.ts     ← CRUD, auto-versioning
    ├── aiGeneratorService.ts ← prompt → nodes/edges via Claude (SSE streaming)
    └── exportService.ts      ← JSON export; PNG/SVG handled frontend-only

frontend/src/canvas/
├── Board/
│   ├── CanvasBoard.tsx
│   ├── CanvasControls.tsx
│   ├── SelectionToolbar.tsx
│   └── useCanvas.ts
├── NodeTypes/
│   ├── BaseNode.tsx
│   ├── InfrastructureNodes.tsx
│   ├── ComputeNodes.tsx
│   ├── DataNodes.tsx
│   ├── ExternalNodes.tsx
│   ├── CloudNodes.tsx
│   ├── ConceptNodes.tsx
│   └── CustomNode.tsx
├── Palette/
│   ├── Palette.tsx
│   ├── PaletteCategory.tsx
│   ├── PaletteItem.tsx
│   └── CustomNodeManager.tsx
├── Toolbar/
│   ├── Toolbar.tsx
│   ├── UndoRedoButtons.tsx
│   ├── ExportMenu.tsx
│   └── VersionHistory.tsx
├── AIGenerator/
│   ├── AIGeneratorPanel.tsx
│   ├── GenerationProgress.tsx
│   └── useAIGenerator.ts
└── DiagramList/
    ├── DiagramList.tsx
    ├── DiagramCard.tsx
    └── useDiagramList.ts
```

---

## 5. Node Type Palette

| Category | Nodes |
|---|---|
| Infrastructure | Load Balancer, CDN, DNS, Firewall, VPN |
| Compute | Microservice, Server, Serverless Function, Container/Pod |
| Data | SQL DB, NoSQL DB, Cache (Redis), Message Queue, Data Warehouse, Object Storage |
| External | Client (Web), Client (Mobile), Third-party API, Telegram Bot |
| Cloud | Region box, Availability Zone boundary (group nodes) |
| Concepts | Rate Limiter, API Gateway, Service Mesh |
| Custom | User-defined nodes with custom icon/color |

All nodes share a `BaseNode` wrapper: icon + editable label (double-click) + color dot + resize handle + selection ring.

---

## 6. Data Models

```prisma
model Diagram {
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?
  thumbnail   String?     // base64 PNG for diagram list preview
  nodes       Json        @default("[]")
  edges       Json        @default("[]")
  viewport    Json?       // { x, y, zoom }
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user     User             @relation(fields: [userId], references: [id])
  versions DiagramVersion[]

  @@index([userId])
}

model DiagramVersion {
  id        String   @id @default(uuid())
  diagramId String
  version   Int
  nodes     Json
  edges     Json
  createdAt DateTime @default(now())

  diagram Diagram @relation(fields: [diagramId], references: [id], onDelete: Cascade)

  @@unique([diagramId, version])
  @@index([diagramId])
}

model CustomNodeType {
  id          String   @id @default(uuid())
  userId      String
  name        String
  iconSvg     String?
  color       String   @default("#6366f1")
  description String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, name])
}
```

**Design decision:** nodes/edges stored as `Json` (not separate rows) — React Flow works natively with arrays, one read/write per save, simpler versioning. Separate rows would only pay off if querying individual nodes across diagrams.

---

## 7. Shared TypeScript Types (`shared/types.ts`)

```typescript
export type NodeType =
  | 'load-balancer' | 'cdn' | 'dns' | 'firewall' | 'vpn'
  | 'microservice' | 'server' | 'serverless' | 'container'
  | 'sql-db' | 'nosql-db' | 'cache' | 'message-queue'
  | 'data-warehouse' | 'object-storage'
  | 'client-web' | 'client-mobile' | 'third-party-api' | 'telegram-bot'
  | 'cloud-region' | 'availability-zone'
  | 'rate-limiter' | 'api-gateway' | 'service-mesh'
  | 'custom';

export interface DiagramNodeData {
  label: string;
  nodeType: NodeType;
  description?: string;
  technology?: string;      // e.g. "PostgreSQL", "Redis", "Kafka"
  color?: string;
  customNodeTypeId?: string;
}

export interface DiagramMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateDiagramRequest {
  prompt: string;
}

export interface DiagramNodeRaw {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: DiagramNodeData;
}

export interface DiagramEdgeRaw {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface GenerateDiagramResponse {
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  name: string;
  description: string;
}
```

---

## 8. API Endpoints

```
GET    /api/canvas/diagrams                       list diagrams (meta only)
POST   /api/canvas/diagrams                       create new diagram
GET    /api/canvas/diagrams/:id                   load full diagram
PUT    /api/canvas/diagrams/:id                   save diagram (auto-save)
DELETE /api/canvas/diagrams/:id                   delete diagram

GET    /api/canvas/diagrams/:id/versions          list version history
GET    /api/canvas/diagrams/:id/versions/:ver     restore a version

POST   /api/canvas/generate                       AI generate from prompt (SSE stream)
POST   /api/canvas/diagrams/:id/export            export as JSON (PNG/SVG = frontend-only)

GET    /api/canvas/node-types/custom              list custom node types
POST   /api/canvas/node-types/custom              create custom node type
DELETE /api/canvas/node-types/custom/:id          delete custom node type
```

---

## 9. Data Flows

### Auto-save
```
User edits canvas
  → useCanvas.ts debounce (1.5s)
  → PUT /api/canvas/diagrams/:id  { nodes, edges, viewport, thumbnail }
  → diagramService.save()
      → prisma.diagram.update()
      → if (saveCount % 10 === 0) create DiagramVersion snapshot
  → Toolbar shows "Saved" / "Saving..." / "Save failed — retry"
```

### AI Generate (SSE streaming)
```
User types prompt → clicks Generate
  → useAIGenerator.ts opens SSE connection
  → POST /api/canvas/generate  { prompt }
  → aiGeneratorService.generate(prompt)
      → claudeService.generateDiagram(prompt)
          prompt instructs Claude to return ONLY valid JSON:
          { name, description, nodes: [{id, type, label, technology, position}],
            edges: [{id, source, target, label}] }
      → validate each node type against NodeType enum
        (invalid types fall back to 'custom' — never throws)
      → stream nodes via SSE as they resolve
  → frontend fades each node onto canvas as it arrives
  → auto-save triggered after stream completes
  → user can cancel mid-stream (partial nodes remain)
```

### Export
```
PNG/SVG: html-to-image renders React Flow canvas → browser download (no backend)
JSON:    POST /api/canvas/diagrams/:id/export
         → exportService.toJson() → { nodes, edges, meta }
         → browser download
```

---

## 10. Auto-save & Versioning Rules

- Debounce: 1.5s after last change
- Version snapshot: every 10 saves OR on explicit "Save Version" click
- Max versions per diagram: 20 (oldest pruned on creation of 21st)
- Restore: replaces current nodes/edges, does not create a new version

---

## 11. Error Handling

| Scenario | Behaviour |
|---|---|
| Claude timeout / generation fails | Inline error in AIGeneratorPanel + retry button. Partial nodes stay. |
| Claude returns invalid node type | Falls back to `custom` type — canvas never crashes. |
| Auto-save fails | Toolbar: "Save failed — retry". Local state preserved. User not blocked. |
| SSE stream drops mid-generation | Partial result shown + "Generation interrupted" notice. |
| Version restore fails | Toast error, modal stays open, current canvas untouched. |
| PNG/SVG export timeout (dense canvas) | "Export failed, try zooming out first" message. |
| DB unavailable on load | 503 → frontend empty state with retry button. |

**Backend error pattern** (same as pocketknife):
```typescript
try {
  const result = await service.operation();
  res.json({ success: true, result });
} catch (error) {
  logger.fail('Operation failed', { error });
  res.status(500).json({ success: false, message: 'Operation failed' });
}
```

---

## 12. Testing Strategy

**Backend (Vitest):**
```
canvas/services/diagramService.test.ts
  - save creates version snapshot at every 10th save
  - version count pruned at 20
  - restore replaces nodes/edges correctly

canvas/services/aiGeneratorService.test.ts
  - valid prompt returns nodes + edges matching NodeType enum
  - invalid node types in Claude response fall back to 'custom'
  - malformed JSON from Claude handled gracefully (throws with clear message)

canvas/services/exportService.test.ts
  - JSON export shape matches GenerateDiagramResponse interface
```

**Frontend (Vitest + Testing Library):**
```
canvas/Board/useCanvas.test.ts
  - debounce triggers save after 1.5s of inactivity
  - undo/redo correctly reverses node state

canvas/AIGenerator/useAIGenerator.test.ts
  - SSE events append nodes to canvas state
  - cancel() stops stream and retains partial nodes

canvas/Palette/PaletteItem.test.ts
  - drag events produce correct DiagramNodeData shape

canvas/DiagramList/DiagramList.test.ts
  - renders diagram cards with name + thumbnail
  - delete triggers confirmation before removing
```

**Not tested:**
- React Flow internals (zoom, pan, edge routing) — library responsibility
- `html-to-image` rendering — browser-only, manual QA
- Claude API responses — mocked at `claudeService` boundary

---

## 13. Out of Scope (App A)

- Real-time multiplayer collaboration (single user only for now)
- Diagram sharing via public link (future)
- Sequence diagrams / ERD / flowchart modes (future)
- Mobile layout (desktop-first)
