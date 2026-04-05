# Canvas App (App A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build App A of ScrambleStack — a Miro-like system design canvas with drag-and-drop nodes, edge connections, version history, and AI-powered diagram generation from natural language prompts.

**Architecture:** Feature-sliced monorepo with one Railway backend (Express + Prisma + PostgreSQL) and one Vercel frontend (React + Vite + Tailwind + React Flow v12). Core services are copied and adapted from `/Users/itayos/mygit/pocketknife`. Canvas logic lives in `backend/src/canvas/` and `frontend/src/canvas/`.

**Tech Stack:** Node.js 18+ / Express / TypeScript / Prisma 7 / PostgreSQL / React 18 / Vite / Tailwind CSS / @xyflow/react v12 / html-to-image / Vitest / Testing Library

---

## Pause & Resume

Each phase ends with a commit. To resume after a break:
1. `cd /Users/itayos/mygit/scramble-stack`
2. `git log --oneline` — find the last completed phase commit
3. Open this file, find the first unchecked `- [ ]` step, continue from there

---

## File Map

```
scramble-stack/
├── package.json                          ← monorepo root (npm workspaces)
├── shared/
│   └── types.ts                          ← CREATE: shared TS types (NodeType, DiagramMeta, etc.)
├── backend/
│   ├── package.json                      ← CREATE
│   ├── tsconfig.json                     ← CREATE
│   ├── prisma/
│   │   └── schema.prisma                 ← CREATE: Diagram, DiagramVersion, CustomNodeType models
│   └── src/
│       ├── index.ts                      ← CREATE: Express app entry point
│       ├── middleware/
│       │   └── authMiddleware.ts         ← CREATE: JWT auth guard
│       ├── core/
│       │   ├── claudeService.ts          ← ADAPT from pocketknife (add generateDiagram, remove email methods)
│       │   ├── databaseService.ts        ← COPY from pocketknife (no changes)
│       │   ├── cacheService.ts           ← COPY from pocketknife (no changes)
│       │   ├── configService.ts          ← ADAPT from pocketknife (replace config keys)
│       │   └── logger.ts                 ← COPY from pocketknife (no changes)
│       └── canvas/
│           ├── routes.ts                 ← CREATE
│           ├── canvasController.ts       ← CREATE
│           └── services/
│               ├── diagramService.ts     ← CREATE: CRUD + auto-versioning
│               ├── aiGeneratorService.ts ← CREATE: prompt → diagram via Claude
│               └── exportService.ts      ← CREATE: JSON export
├── frontend/
│   ├── package.json                      ← CREATE
│   ├── tsconfig.json                     ← CREATE
│   ├── vite.config.ts                    ← CREATE
│   ├── tailwind.config.js                ← CREATE
│   ├── postcss.config.js                 ← CREATE
│   ├── index.html                        ← CREATE
│   └── src/
│       ├── main.tsx                      ← CREATE
│       ├── App.tsx                       ← CREATE: React Router setup + canvas route
│       ├── services/
│       │   └── canvasApi.ts              ← CREATE: typed API client
│       └── canvas/
│           ├── Board/
│           │   ├── CanvasBoard.tsx       ← CREATE
│           │   ├── CanvasControls.tsx    ← CREATE
│           │   ├── SelectionToolbar.tsx  ← CREATE
│           │   └── useCanvas.ts          ← CREATE
│           ├── NodeTypes/
│           │   ├── BaseNode.tsx          ← CREATE: shared node wrapper
│           │   ├── InfrastructureNodes.tsx ← CREATE
│           │   ├── ComputeNodes.tsx      ← CREATE
│           │   ├── DataNodes.tsx         ← CREATE
│           │   ├── ExternalNodes.tsx     ← CREATE
│           │   ├── CloudNodes.tsx        ← CREATE
│           │   ├── ConceptNodes.tsx      ← CREATE
│           │   └── CustomNode.tsx        ← CREATE
│           ├── Palette/
│           │   ├── Palette.tsx           ← CREATE
│           │   ├── PaletteCategory.tsx   ← CREATE
│           │   ├── PaletteItem.tsx       ← CREATE
│           │   └── CustomNodeManager.tsx ← CREATE
│           ├── Toolbar/
│           │   ├── Toolbar.tsx           ← CREATE
│           │   ├── UndoRedoButtons.tsx   ← CREATE
│           │   ├── ExportMenu.tsx        ← CREATE
│           │   └── VersionHistory.tsx    ← CREATE
│           ├── AIGenerator/
│           │   ├── AIGeneratorPanel.tsx  ← CREATE
│           │   ├── GenerationProgress.tsx ← CREATE
│           │   └── useAIGenerator.ts     ← CREATE
│           └── DiagramList/
│               ├── DiagramList.tsx       ← CREATE
│               ├── DiagramCard.tsx       ← CREATE
│               └── useDiagramList.ts     ← CREATE
```

---

## PHASE 0 — Foundation

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `.env.example`

- [ ] **Step 1: Create root package.json (npm workspaces)**

```json
{
  "name": "scramble-stack",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["backend", "frontend", "shared"],
  "scripts": {
    "dev:backend": "npm run dev --workspace=backend",
    "dev:frontend": "npm run dev --workspace=frontend",
    "build:backend": "npm run build --workspace=backend",
    "build:frontend": "npm run build --workspace=frontend"
  }
}
```

- [ ] **Step 2: Create backend/package.json**

```json
{
  "name": "scramble-stack-backend",
  "version": "1.0.0",
  "main": "src/index.ts",
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "prisma generate && tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@prisma/adapter-pg": "^7.2.0",
    "@prisma/client": "^7.2.0",
    "axios": "^1.7.7",
    "body-parser": "^1.20.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^8.2.1",
    "helmet": "^8.1.0",
    "ioredis": "^5.8.2",
    "jsonwebtoken": "^9.0.2",
    "node-cache": "^5.1.2",
    "pg": "^8.16.3",
    "prisma": "^7.2.0",
    "winston": "^3.15.0",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/node": "^20.14.0",
    "@types/pg": "^8.16.0",
    "@vitest/coverage-v8": "^2.1.9",
    "rimraf": "^5.0.5",
    "tsx": "^4.19.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 3: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create frontend/package.json**

```json
{
  "name": "scramble-stack-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@xyflow/react": "^12.3.6",
    "axios": "^1.6.2",
    "html-to-image": "^1.11.11",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^14.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/coverage-v8": "^2.1.9",
    "autoprefixer": "^10.4.16",
    "happy-dom": "^13.10.1",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "tsx": "^3.14.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 5: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 7: Create frontend/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#0f172a',
          panel: '#1e293b',
          border: '#334155',
          accent: '#6366f1',
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 8: Create frontend/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 9: Create frontend/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ScrambleStack</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create .env.example at repo root**

```
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/scramblestack
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-jwt-secret-min-32-chars
PORT=3000
NODE_ENV=development

# Frontend (Vite exposes VITE_ prefix)
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 11: Install dependencies**

```bash
cd /Users/itayos/mygit/scramble-stack
npm install --workspace=backend
npm install --workspace=frontend
```

Expected: Both workspaces install without errors.

- [ ] **Step 12: Create frontend/src/test/setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 13: Commit**

```bash
git add .
git commit -m "chore: scaffold monorepo — backend and frontend packages"
```

---

### Task 2: Copy and adapt core backend services

**Files:**
- Create: `backend/src/core/logger.ts` (copy)
- Create: `backend/src/core/databaseService.ts` (copy)
- Create: `backend/src/core/cacheService.ts` (copy)
- Create: `backend/src/core/claudeService.ts` (adapt)
- Create: `backend/src/core/configService.ts` (adapt)

- [ ] **Step 1: Copy logger.ts verbatim**

```bash
cp /Users/itayos/mygit/pocketknife/backend/src/utils/logger.ts \
   /Users/itayos/mygit/scramble-stack/backend/src/core/logger.ts
```

Open `backend/src/core/logger.ts` and add `canvas` to the ICONS object (around line 65):

```typescript
// Add to ICONS object:
canvas: '🎨',
news: '📰',
practice: '🧠',
```

- [ ] **Step 2: Copy databaseService.ts verbatim**

```bash
cp /Users/itayos/mygit/pocketknife/backend/src/services/core/databaseService.ts \
   /Users/itayos/mygit/scramble-stack/backend/src/core/databaseService.ts
```

Update the import path for logger (line 4):
```typescript
// Change:
import logger from '../../utils/logger';
// To:
import logger from './logger';
```

- [ ] **Step 3: Copy cacheService.ts verbatim**

```bash
cp /Users/itayos/mygit/pocketknife/backend/src/services/core/cacheService.ts \
   /Users/itayos/mygit/scramble-stack/backend/src/core/cacheService.ts
```

Update import path (line 4):
```typescript
// Change:
import logger from '../../utils/logger';
// To:
import logger from './logger';
```

Replace the `cacheKeys` block at the bottom of the file with:
```typescript
export const cacheKeys = {
  diagramList: (userId: string) => `canvas:diagrams:${userId}`,
  diagram: (id: string) => `canvas:diagram:${id}`,
  diagramVersions: (diagramId: string) => `canvas:versions:${diagramId}`,
  customNodeTypes: (userId: string) => `canvas:custom-nodes:${userId}`,
};
```

- [ ] **Step 4: Create backend/src/core/claudeService.ts (adapted)**

Create this file from scratch — it keeps `generateText`, `chat`, `analyzeImage` from pocketknife and adds `generateDiagram`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import https from 'https';
import logger from './logger';
import type { GenerateDiagramResponse, NodeType } from '@shared/types';

const VALID_NODE_TYPES: NodeType[] = [
  'load-balancer', 'cdn', 'dns', 'firewall', 'vpn',
  'microservice', 'server', 'serverless', 'container',
  'sql-db', 'nosql-db', 'cache', 'message-queue', 'data-warehouse', 'object-storage',
  'client-web', 'client-mobile', 'third-party-api', 'telegram-bot',
  'cloud-region', 'availability-zone',
  'rate-limiter', 'api-gateway', 'service-mesh',
  'custom',
];

class ClaudeService {
  private client: Anthropic | null = null;

  private initializeClient(): void {
    if (this.client) return;

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    this.client = new Anthropic({
      apiKey,
      httpAgent: new https.Agent({ rejectUnauthorized: false }),
    });
  }

  async generateText(prompt: string, maxTokens = 4096): Promise<string> {
    this.initializeClient();
    const message = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = message.content.find(b => b.type === 'text');
    return block?.type === 'text' ? block.text : '';
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { maxTokens?: number; system?: string }
  ): Promise<{ content: string }> {
    this.initializeClient();
    const response = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens ?? 1500,
      system: options?.system,
      messages,
    });
    const block = response.content.find(b => b.type === 'text');
    return { content: block?.type === 'text' ? block.text : '' };
  }

  async generateDiagram(prompt: string): Promise<GenerateDiagramResponse> {
    const systemPrompt = `You are a system design expert. Generate a system architecture diagram.

Return ONLY valid JSON (no markdown, no backticks):
{
  "name": "Short diagram name (3-5 words)",
  "description": "One sentence description",
  "nodes": [
    {
      "id": "node_1",
      "type": "api-gateway",
      "position": { "x": 400, "y": 100 },
      "data": {
        "label": "API Gateway",
        "nodeType": "api-gateway",
        "technology": "Kong",
        "description": "Routes incoming requests"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "HTTP",
      "animated": false
    }
  ]
}

Valid nodeType values: ${VALID_NODE_TYPES.join(', ')}

Layout rules:
- Clients at y=50, gateways/LBs at y=220, services at y=400, databases at y=580
- Start x at 100, use 250px horizontal spacing between nodes at the same y level
- Center nodes by layer: if 3 services, center them around x=400`;

    const response = await this.generateText(
      `${systemPrompt}\n\nDesign prompt: ${prompt}`,
      4000
    );

    const clean = response.replace(/```json|```/g, '').trim();
    let result: GenerateDiagramResponse;

    try {
      result = JSON.parse(clean) as GenerateDiagramResponse;
    } catch {
      logger.fail('Failed to parse Claude diagram response', { raw: clean.slice(0, 200) });
      throw new Error('Claude returned invalid JSON for diagram generation');
    }

    result.nodes = result.nodes.map(node => ({
      ...node,
      type: VALID_NODE_TYPES.includes(node.type as NodeType) ? node.type : 'custom',
      data: {
        ...node.data,
        nodeType: VALID_NODE_TYPES.includes(node.data.nodeType as NodeType)
          ? node.data.nodeType
          : 'custom',
      },
    }));

    return result;
  }
}

export default new ClaudeService();
```

- [ ] **Step 5: Create backend/src/core/configService.ts (adapted)**

```typescript
import logger from './logger';

const DEFAULT_CONFIG = {
  'canvas.diagram.maxVersions': 20,
  'canvas.diagram.versionEveryNSaves': 10,
  'canvas.ai.maxTokens': 4000,
  'canvas.export.maxThumbnailSize': 500000,
  'api.rateLimit.requests': 100,
  'api.rateLimit.windowMs': 60000,
  'ai.claude.defaultModel': 'claude-sonnet-4-20250514',
  'cache.memory.ttlSeconds': 300,
  'cache.redis.ttlSeconds': 3600,
} as const;

type ConfigKey = keyof typeof DEFAULT_CONFIG;
type ConfigValue = string | number | boolean;

let configCache: Map<string, unknown> = new Map();

export const configService = {
  init: async (): Promise<void> => {
    logger.success('Config service initialized');
  },

  get: <T extends ConfigValue>(key: ConfigKey, defaultValue?: T): T => {
    const envKey = key.toUpperCase().replace(/\./g, '_');
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      if (envValue === 'true') return true as T;
      if (envValue === 'false') return false as T;
      if (!isNaN(Number(envValue))) return Number(envValue) as T;
      return envValue as T;
    }
    const dbValue = configCache.get(key);
    if (dbValue !== undefined) return dbValue as T;
    return (defaultValue ?? DEFAULT_CONFIG[key]) as T;
  },
};

export default configService;
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/core/
git commit -m "chore: copy and adapt core backend services from pocketknife"
```

---

### Task 3: Shared types

**Files:**
- Create: `shared/package.json`
- Create: `shared/types.ts`

- [ ] **Step 1: Create shared/package.json**

```json
{
  "name": "@scramble-stack/shared",
  "version": "1.0.0",
  "main": "types.ts",
  "types": "types.ts"
}
```

- [ ] **Step 2: Create shared/types.ts**

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
  technology?: string;
  color?: string;
  customNodeTypeId?: string;
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

export interface DiagramMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagramFull extends DiagramMeta {
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface GenerateDiagramRequest {
  prompt: string;
}

export interface GenerateDiagramResponse {
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  name: string;
  description: string;
}

export interface DiagramVersionMeta {
  id: string;
  version: number;
  createdAt: string;
}

export interface CustomNodeTypeData {
  id: string;
  name: string;
  iconSvg?: string;
  color: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add shared/
git commit -m "feat: add shared TypeScript types"
```

---

### Task 4: Prisma schema and database setup

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/prisma.config.ts`

- [ ] **Step 1: Create backend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  diagrams        Diagram[]
  customNodeTypes CustomNodeType[]
}

model Diagram {
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?
  thumbnail   String?
  nodes       Json     @default("[]")
  edges       Json     @default("[]")
  viewport    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

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

- [ ] **Step 2: Create backend/prisma/prisma.config.ts** (Prisma 7 requirement)

```typescript
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: {
    kind: 'single',
    filePath: './prisma/schema.prisma',
  },
  migrations: {
    connectionString: process.env.DATABASE_URL ?? '',
  },
});
```

- [ ] **Step 3: Run initial migration**

```bash
cd /Users/itayos/mygit/scramble-stack/backend
# Ensure DATABASE_URL is set in .env, then:
npx prisma migrate dev --name init
```

Expected: Migration created in `prisma/migrations/`, Prisma client generated.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add Prisma schema with Diagram, DiagramVersion, CustomNodeType models"
```

---

## PHASE 1 — Backend Canvas Module

### Task 5: diagramService with tests

**Files:**
- Create: `backend/src/canvas/services/diagramService.ts`
- Create: `backend/src/canvas/services/__tests__/diagramService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/canvas/services/__tests__/diagramService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = {
  diagram: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  diagramVersion: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('../../../core/databaseService', () => ({
  getPrisma: () => mockPrisma,
}));

import { diagramService } from '../diagramService';

const mockNodes = [{ id: 'n1', type: 'microservice', position: { x: 100, y: 100 }, data: { label: 'Service', nodeType: 'microservice' } }];
const mockEdges = [{ id: 'e1', source: 'n1', target: 'n2' }];
const mockDiagram = { id: 'diag-1', userId: 'user-1', name: 'Test', nodes: mockNodes, edges: mockEdges, viewport: null, description: null, thumbnail: null, createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('diagramService.list', () => {
  it('returns meta-only diagrams for user', async () => {
    mockPrisma.diagram.findMany.mockResolvedValue([mockDiagram]);
    const result = await diagramService.list('user-1');
    expect(mockPrisma.diagram.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: expect.objectContaining({ nodes: false, edges: false }),
      orderBy: { updatedAt: 'desc' },
    });
    expect(result).toHaveLength(1);
  });
});

describe('diagramService.save', () => {
  it('updates diagram and creates version every 10 saves', async () => {
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);
    mockPrisma.diagramVersion.count.mockResolvedValue(9); // 9 existing versions → 10th save triggers snapshot
    mockPrisma.diagramVersion.create.mockResolvedValue({});

    await diagramService.save('diag-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    // Should create a version on the 10th save
    expect(mockPrisma.diagramVersion.create).toHaveBeenCalled();
  });

  it('does not create version before 10 saves', async () => {
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);
    mockPrisma.diagramVersion.count.mockResolvedValue(3);

    await diagramService.save('diag-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.create).not.toHaveBeenCalled();
  });

  it('prunes versions beyond 20', async () => {
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);
    mockPrisma.diagramVersion.count.mockResolvedValue(19); // triggers version creation
    mockPrisma.diagramVersion.create.mockResolvedValue({ id: 'v-new', version: 21 });
    mockPrisma.diagramVersion.findMany.mockResolvedValue([{ id: 'old-v', version: 1 }]); // oldest to prune

    await diagramService.save('diag-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.deleteMany).toHaveBeenCalled();
  });
});

describe('diagramService.restore', () => {
  it('replaces diagram nodes and edges with version snapshot', async () => {
    const version = { id: 'v1', nodes: mockNodes, edges: mockEdges };
    mockPrisma.diagramVersion.findFirst.mockResolvedValue(version);
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);

    await diagramService.restore('diag-1', 5);

    expect(mockPrisma.diagram.update).toHaveBeenCalledWith({
      where: { id: 'diag-1' },
      data: { nodes: mockNodes, edges: mockEdges },
    });
  });

  it('throws if version not found', async () => {
    mockPrisma.diagramVersion.findFirst.mockResolvedValue(null);
    await expect(diagramService.restore('diag-1', 99)).rejects.toThrow('Version 99 not found');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/itayos/mygit/scramble-stack/backend
npx vitest run src/canvas/services/__tests__/diagramService.test.ts
```

Expected: FAIL — `diagramService` does not exist yet.

- [ ] **Step 3: Implement diagramService**

Create `backend/src/canvas/services/diagramService.ts`:

```typescript
import { getPrisma } from '../../core/databaseService';
import logger from '../../core/logger';
import type { DiagramNodeRaw, DiagramEdgeRaw, DiagramMeta, DiagramFull, DiagramVersionMeta } from '@shared/types';

const MAX_VERSIONS = 20;
const VERSION_EVERY_N_SAVES = 10;

export interface SaveDiagramPayload {
  name: string;
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  viewport: { x: number; y: number; zoom: number } | null;
  thumbnail: string | null;
}

export const diagramService = {
  async list(userId: string): Promise<DiagramMeta[]> {
    const prisma = getPrisma()!;
    const diagrams = await prisma.diagram.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        nodes: false,
        edges: false,
        viewport: false,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return diagrams.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      thumbnail: d.thumbnail ?? undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  },

  async get(id: string, userId: string): Promise<DiagramFull | null> {
    const prisma = getPrisma()!;
    const diagram = await prisma.diagram.findFirst({ where: { id, userId } });
    if (!diagram) return null;

    return {
      id: diagram.id,
      name: diagram.name,
      description: diagram.description ?? undefined,
      thumbnail: diagram.thumbnail ?? undefined,
      nodes: diagram.nodes as DiagramNodeRaw[],
      edges: diagram.edges as DiagramEdgeRaw[],
      viewport: diagram.viewport as { x: number; y: number; zoom: number } | undefined,
      createdAt: diagram.createdAt.toISOString(),
      updatedAt: diagram.updatedAt.toISOString(),
    };
  },

  async create(userId: string, name: string): Promise<DiagramFull> {
    const prisma = getPrisma()!;
    const diagram = await prisma.diagram.create({
      data: { userId, name, nodes: [], edges: [] },
    });

    return {
      id: diagram.id,
      name: diagram.name,
      nodes: [],
      edges: [],
      createdAt: diagram.createdAt.toISOString(),
      updatedAt: diagram.updatedAt.toISOString(),
    };
  },

  async save(id: string, payload: SaveDiagramPayload): Promise<void> {
    const prisma = getPrisma()!;

    await prisma.diagram.update({
      where: { id },
      data: {
        name: payload.name,
        nodes: payload.nodes,
        edges: payload.edges,
        viewport: payload.viewport ?? undefined,
        thumbnail: payload.thumbnail ?? undefined,
      },
    });

    const versionCount = await prisma.diagramVersion.count({ where: { diagramId: id } });

    if (versionCount % VERSION_EVERY_N_SAVES === VERSION_EVERY_N_SAVES - 1) {
      await prisma.diagramVersion.create({
        data: {
          diagramId: id,
          version: versionCount + 1,
          nodes: payload.nodes,
          edges: payload.edges,
        },
      });

      if (versionCount + 1 > MAX_VERSIONS) {
        const oldest = await prisma.diagramVersion.findMany({
          where: { diagramId: id },
          orderBy: { version: 'asc' },
          take: versionCount + 1 - MAX_VERSIONS,
          select: { id: true },
        });
        await prisma.diagramVersion.deleteMany({
          where: { id: { in: oldest.map(v => v.id) } },
        });
      }
    }

    logger.canvas(`Diagram saved`, { id });
  },

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma()!;
    await prisma.diagram.delete({ where: { id, userId } });
  },

  async listVersions(diagramId: string): Promise<DiagramVersionMeta[]> {
    const prisma = getPrisma()!;
    const versions = await prisma.diagramVersion.findMany({
      where: { diagramId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, createdAt: true },
    });

    return versions.map(v => ({
      id: v.id,
      version: v.version,
      createdAt: v.createdAt.toISOString(),
    }));
  },

  async restore(diagramId: string, version: number): Promise<void> {
    const prisma = getPrisma()!;
    const snapshot = await prisma.diagramVersion.findFirst({
      where: { diagramId, version },
    });

    if (!snapshot) throw new Error(`Version ${version} not found for diagram ${diagramId}`);

    await prisma.diagram.update({
      where: { id: diagramId },
      data: { nodes: snapshot.nodes, edges: snapshot.edges },
    });
  },
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/canvas/services/__tests__/diagramService.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/canvas/services/
git commit -m "feat: add diagramService with CRUD and auto-versioning"
```

---

### Task 6: aiGeneratorService with tests

**Files:**
- Create: `backend/src/canvas/services/aiGeneratorService.ts`
- Create: `backend/src/canvas/services/__tests__/aiGeneratorService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/canvas/services/__tests__/aiGeneratorService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GenerateDiagramResponse } from '@shared/types';

const mockGenerateDiagram = vi.fn();

vi.mock('../../../core/claudeService', () => ({
  default: { generateDiagram: mockGenerateDiagram },
}));

import { aiGeneratorService } from '../aiGeneratorService';

const validResponse: GenerateDiagramResponse = {
  name: 'Ride Sharing App',
  description: 'Basic ride sharing architecture',
  nodes: [
    { id: 'n1', type: 'client-mobile', position: { x: 100, y: 50 }, data: { label: 'Mobile App', nodeType: 'client-mobile' } },
    { id: 'n2', type: 'api-gateway', position: { x: 100, y: 220 }, data: { label: 'API Gateway', nodeType: 'api-gateway', technology: 'Kong' } },
  ],
  edges: [{ id: 'e1', source: 'n1', target: 'n2', label: 'HTTPS' }],
};

beforeEach(() => vi.clearAllMocks());

describe('aiGeneratorService.generate', () => {
  it('returns valid diagram from Claude response', async () => {
    mockGenerateDiagram.mockResolvedValue(validResponse);
    const result = await aiGeneratorService.generate('design a ride sharing app');
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.name).toBe('Ride Sharing App');
  });

  it('falls back to custom node type for unknown types', async () => {
    mockGenerateDiagram.mockResolvedValue({
      ...validResponse,
      nodes: [
        { id: 'n1', type: 'unknown-type', position: { x: 0, y: 0 }, data: { label: 'X', nodeType: 'unknown-type' } },
      ],
    });
    const result = await aiGeneratorService.generate('test prompt');
    expect(result.nodes[0].type).toBe('custom');
    expect(result.nodes[0].data.nodeType).toBe('custom');
  });

  it('throws with clear message when Claude returns malformed JSON', async () => {
    mockGenerateDiagram.mockRejectedValue(new Error('Claude returned invalid JSON'));
    await expect(aiGeneratorService.generate('bad prompt')).rejects.toThrow('Claude returned invalid JSON');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/canvas/services/__tests__/aiGeneratorService.test.ts
```

Expected: FAIL — `aiGeneratorService` does not exist yet.

- [ ] **Step 3: Implement aiGeneratorService**

Create `backend/src/canvas/services/aiGeneratorService.ts`:

```typescript
import claudeService from '../../core/claudeService';
import logger from '../../core/logger';
import type { GenerateDiagramResponse, NodeType } from '@shared/types';

const VALID_NODE_TYPES: NodeType[] = [
  'load-balancer', 'cdn', 'dns', 'firewall', 'vpn',
  'microservice', 'server', 'serverless', 'container',
  'sql-db', 'nosql-db', 'cache', 'message-queue', 'data-warehouse', 'object-storage',
  'client-web', 'client-mobile', 'third-party-api', 'telegram-bot',
  'cloud-region', 'availability-zone',
  'rate-limiter', 'api-gateway', 'service-mesh',
  'custom',
];

function sanitizeNodeType(type: string): NodeType {
  return VALID_NODE_TYPES.includes(type as NodeType) ? (type as NodeType) : 'custom';
}

export const aiGeneratorService = {
  async generate(prompt: string): Promise<GenerateDiagramResponse> {
    logger.canvas(`Generating diagram`, { prompt: prompt.slice(0, 80) });

    const result = await claudeService.generateDiagram(prompt);

    const sanitized: GenerateDiagramResponse = {
      ...result,
      nodes: result.nodes.map(node => ({
        ...node,
        type: sanitizeNodeType(node.type),
        data: { ...node.data, nodeType: sanitizeNodeType(node.data.nodeType) },
      })),
    };

    logger.canvas(`Diagram generated`, { nodeCount: sanitized.nodes.length, edgeCount: sanitized.edges.length });
    return sanitized;
  },
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/canvas/services/__tests__/aiGeneratorService.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/canvas/services/aiGeneratorService.ts backend/src/canvas/services/__tests__/aiGeneratorService.test.ts
git commit -m "feat: add aiGeneratorService — prompt to diagram via Claude"
```

---

### Task 7: exportService with tests

**Files:**
- Create: `backend/src/canvas/services/exportService.ts`
- Create: `backend/src/canvas/services/__tests__/exportService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/canvas/services/__tests__/exportService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { exportService } from '../exportService';
import type { DiagramFull } from '@shared/types';

const mockDiagram: DiagramFull = {
  id: 'diag-1',
  name: 'Test Diagram',
  description: 'A test',
  nodes: [{ id: 'n1', type: 'microservice', position: { x: 100, y: 100 }, data: { label: 'Service', nodeType: 'microservice' } }],
  edges: [{ id: 'e1', source: 'n1', target: 'n2', label: 'HTTP' }],
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
};

describe('exportService.toJson', () => {
  it('returns nodes, edges, and meta', () => {
    const result = exportService.toJson(mockDiagram);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
    expect(result.meta.id).toBe('diag-1');
    expect(result.meta.name).toBe('Test Diagram');
  });

  it('does not include thumbnail in export', () => {
    const result = exportService.toJson({ ...mockDiagram, thumbnail: 'data:image/png;base64,...' });
    expect(result.meta).not.toHaveProperty('thumbnail');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/canvas/services/__tests__/exportService.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement exportService**

Create `backend/src/canvas/services/exportService.ts`:

```typescript
import type { DiagramFull, DiagramNodeRaw, DiagramEdgeRaw } from '@shared/types';

interface JsonExport {
  meta: { id: string; name: string; description?: string; createdAt: string; updatedAt: string };
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
}

export const exportService = {
  toJson(diagram: DiagramFull): JsonExport {
    return {
      meta: {
        id: diagram.id,
        name: diagram.name,
        description: diagram.description,
        createdAt: diagram.createdAt,
        updatedAt: diagram.updatedAt,
      },
      nodes: diagram.nodes,
      edges: diagram.edges,
    };
  },
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/canvas/services/__tests__/exportService.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/canvas/services/exportService.ts backend/src/canvas/services/__tests__/exportService.test.ts
git commit -m "feat: add exportService — JSON diagram export"
```

---

### Task 8: Auth middleware

**Files:**
- Create: `backend/src/middleware/authMiddleware.ts`

- [ ] **Step 1: Create authMiddleware.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../core/logger';

export interface AuthRequest extends Request {
  userId: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.fail('JWT_SECRET is not set');
    res.status(500).json({ success: false, message: 'Server misconfiguration' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/
git commit -m "feat: add JWT auth middleware"
```

---

### Task 9: Canvas controller and routes

**Files:**
- Create: `backend/src/canvas/canvasController.ts`
- Create: `backend/src/canvas/routes.ts`

- [ ] **Step 1: Create canvasController.ts**

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { diagramService } from './services/diagramService';
import { aiGeneratorService } from './services/aiGeneratorService';
import { exportService } from './services/exportService';
import { getPrisma } from '../core/databaseService';
import logger from '../core/logger';

export const canvasController = {
  async listDiagrams(req: AuthRequest, res: Response): Promise<void> {
    try {
      const diagrams = await diagramService.list(req.userId);
      res.json({ success: true, data: diagrams });
    } catch (error) {
      logger.fail('Failed to list diagrams', { error });
      res.status(500).json({ success: false, message: 'Failed to list diagrams' });
    }
  },

  async createDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name = 'Untitled Diagram' } = req.body as { name?: string };
      const diagram = await diagramService.create(req.userId, name);
      res.status(201).json({ success: true, data: diagram });
    } catch (error) {
      logger.fail('Failed to create diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to create diagram' });
    }
  },

  async getDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const diagram = await diagramService.get(req.params.id, req.userId);
      if (!diagram) {
        res.status(404).json({ success: false, message: 'Diagram not found' });
        return;
      }
      res.json({ success: true, data: diagram });
    } catch (error) {
      logger.fail('Failed to get diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to get diagram' });
    }
  },

  async saveDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      await diagramService.save(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      logger.fail('Failed to save diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to save diagram' });
    }
  },

  async deleteDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      await diagramService.delete(req.params.id, req.userId);
      res.json({ success: true });
    } catch (error) {
      logger.fail('Failed to delete diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to delete diagram' });
    }
  },

  async listVersions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const versions = await diagramService.listVersions(req.params.id);
      res.json({ success: true, data: versions });
    } catch (error) {
      logger.fail('Failed to list versions', { error });
      res.status(500).json({ success: false, message: 'Failed to list versions' });
    }
  },

  async restoreVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const version = parseInt(req.params.ver, 10);
      await diagramService.restore(req.params.id, version);
      const diagram = await diagramService.get(req.params.id, req.userId);
      res.json({ success: true, data: diagram });
    } catch (error) {
      logger.fail('Failed to restore version', { error });
      res.status(500).json({ success: false, message: 'Failed to restore version' });
    }
  },

  async generateDiagram(req: AuthRequest, res: Response): Promise<void> {
    const { prompt } = req.body as { prompt: string };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: unknown): void => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const diagram = await aiGeneratorService.generate(prompt);

      sendEvent('meta', { name: diagram.name, description: diagram.description });

      for (const node of diagram.nodes) {
        await new Promise<void>(resolve => setTimeout(resolve, 80));
        sendEvent('node', node);
      }

      for (const edge of diagram.edges) {
        sendEvent('edge', edge);
      }

      sendEvent('done', {});
      res.end();
    } catch (error) {
      logger.fail('Diagram generation failed', { error });
      sendEvent('error', { message: 'Generation failed. Please try again.' });
      res.end();
    }
  },

  async exportDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const diagram = await diagramService.get(req.params.id, req.userId);
      if (!diagram) {
        res.status(404).json({ success: false, message: 'Diagram not found' });
        return;
      }
      const exported = exportService.toJson(diagram);
      res.json({ success: true, data: exported });
    } catch (error) {
      logger.fail('Failed to export diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to export diagram' });
    }
  },

  async listCustomNodeTypes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      const types = await prisma.customNodeType.findMany({ where: { userId: req.userId } });
      res.json({ success: true, data: types });
    } catch (error) {
      logger.fail('Failed to list custom node types', { error });
      res.status(500).json({ success: false, message: 'Failed to list custom node types' });
    }
  },

  async createCustomNodeType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      const { name, iconSvg, color, description } = req.body as { name: string; iconSvg?: string; color?: string; description?: string };
      const nodeType = await prisma.customNodeType.create({
        data: { userId: req.userId, name, iconSvg, color: color ?? '#6366f1', description },
      });
      res.status(201).json({ success: true, data: nodeType });
    } catch (error) {
      logger.fail('Failed to create custom node type', { error });
      res.status(500).json({ success: false, message: 'Failed to create custom node type' });
    }
  },

  async deleteCustomNodeType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      await prisma.customNodeType.delete({ where: { id: req.params.id, userId: req.userId } });
      res.json({ success: true });
    } catch (error) {
      logger.fail('Failed to delete custom node type', { error });
      res.status(500).json({ success: false, message: 'Failed to delete custom node type' });
    }
  },
};
```

- [ ] **Step 2: Create canvas/routes.ts**

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { canvasController } from './canvasController';

const router = Router();

// All canvas routes require authentication
router.use(authMiddleware as any);

router.get('/diagrams', (req, res) => canvasController.listDiagrams(req as any, res));
router.post('/diagrams', (req, res) => canvasController.createDiagram(req as any, res));
router.get('/diagrams/:id', (req, res) => canvasController.getDiagram(req as any, res));
router.put('/diagrams/:id', (req, res) => canvasController.saveDiagram(req as any, res));
router.delete('/diagrams/:id', (req, res) => canvasController.deleteDiagram(req as any, res));

router.get('/diagrams/:id/versions', (req, res) => canvasController.listVersions(req as any, res));
router.get('/diagrams/:id/versions/:ver', (req, res) => canvasController.restoreVersion(req as any, res));

router.post('/generate', (req, res) => canvasController.generateDiagram(req as any, res));
router.post('/diagrams/:id/export', (req, res) => canvasController.exportDiagram(req as any, res));

router.get('/node-types/custom', (req, res) => canvasController.listCustomNodeTypes(req as any, res));
router.post('/node-types/custom', (req, res) => canvasController.createCustomNodeType(req as any, res));
router.delete('/node-types/custom/:id', (req, res) => canvasController.deleteCustomNodeType(req as any, res));

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/canvas/canvasController.ts backend/src/canvas/routes.ts
git commit -m "feat: add canvas controller and routes"
```

---

### Task 10: Backend entry point

**Files:**
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create backend/src/index.ts**

```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import canvasRoutes from './canvas/routes';
import { databaseService } from './core/databaseService';
import { cacheService } from './core/cacheService';
import { configService } from './core/configService';
import logger from './core/logger';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(bodyParser.json({ limit: '2mb' })); // thumbnails can be large

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/canvas', canvasRoutes);

async function start(): Promise<void> {
  await configService.init();
  await cacheService.init();

  const requiredEnv = ['ANTHROPIC_API_KEY', 'JWT_SECRET', 'DATABASE_URL'];
  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    logger.fail('Missing required environment variables', { missing: missingEnv });
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.start(`ScrambleStack backend running on port ${PORT}`);
  });
}

start().catch(error => {
  logger.fail('Failed to start server', { error });
  process.exit(1);
});
```

- [ ] **Step 2: Verify backend compiles**

```bash
cd /Users/itayos/mygit/scramble-stack/backend
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add backend Express entry point — phase 1 complete"
```

---

## PHASE 2 — Frontend Scaffold

### Task 11: React app setup + canvasApi

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/services/canvasApi.ts`

- [ ] **Step 1: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background-color: #0f172a;
  color: #f1f5f9;
}

.react-flow__background {
  background-color: #0f172a;
}
```

- [ ] **Step 2: Create frontend/src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create frontend/src/App.tsx**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DiagramList from './canvas/DiagramList/DiagramList';
import CanvasBoard from './canvas/Board/CanvasBoard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/canvas" replace />} />
        <Route path="/canvas" element={<DiagramList />} />
        <Route path="/canvas/:id" element={<CanvasBoard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Create frontend/src/services/canvasApi.ts**

```typescript
import type {
  DiagramMeta, DiagramFull, DiagramVersionMeta,
  SaveDiagramPayload, CustomNodeTypeData, ApiResponse,
  GenerateDiagramResponse,
} from '@shared/types';

// Re-export SaveDiagramPayload so components don't import from backend types
export type { DiagramMeta, DiagramFull, DiagramVersionMeta, CustomNodeTypeData };

const BASE = '/api/canvas';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
  });
  const json = await res.json() as ApiResponse<T>;
  if (!json.success) throw new Error(json.message ?? 'Request failed');
  return json.data as T;
}

export interface SavePayload {
  name: string;
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number } | null;
  thumbnail: string | null;
}

export const canvasApi = {
  listDiagrams: () => request<DiagramMeta[]>('/diagrams'),
  createDiagram: (name: string) => request<DiagramFull>('/diagrams', { method: 'POST', body: JSON.stringify({ name }) }),
  getDiagram: (id: string) => request<DiagramFull>(`/diagrams/${id}`),
  saveDiagram: (id: string, payload: SavePayload) =>
    request<void>(`/diagrams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDiagram: (id: string) => request<void>(`/diagrams/${id}`, { method: 'DELETE' }),

  listVersions: (id: string) => request<DiagramVersionMeta[]>(`/diagrams/${id}/versions`),
  restoreVersion: (id: string, ver: number) => request<DiagramFull>(`/diagrams/${id}/versions/${ver}`),

  exportDiagram: (id: string) => request<GenerateDiagramResponse>(`/diagrams/${id}/export`),

  listCustomNodeTypes: () => request<CustomNodeTypeData[]>('/node-types/custom'),
  createCustomNodeType: (data: Omit<CustomNodeTypeData, 'id'>) =>
    request<CustomNodeTypeData>('/node-types/custom', { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomNodeType: (id: string) => request<void>(`/node-types/custom/${id}`, { method: 'DELETE' }),

  streamGenerate: async (
    prompt: string,
    onNode: (node: unknown) => void,
    onEdge: (edge: unknown) => void,
    onMeta: (meta: { name: string; description: string }) => void,
    onDone: () => void,
    onError: (message: string) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const response = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ prompt }),
      signal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('event: ')) {
          const event = line.slice(7).trim();
          const dataLine = lines[i + 1];
          if (dataLine?.startsWith('data: ')) {
            const data = JSON.parse(dataLine.slice(6));
            if (event === 'node') onNode(data);
            else if (event === 'edge') onEdge(data);
            else if (event === 'meta') onMeta(data);
            else if (event === 'done') onDone();
            else if (event === 'error') onError(data.message);
          }
        }
      }
    }
  },
};
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add frontend scaffold — App.tsx routing and canvasApi service"
```

---

## PHASE 3 — Canvas Node System

### Task 12: BaseNode and all NodeType components

**Files:**
- Create: `frontend/src/canvas/NodeTypes/BaseNode.tsx`
- Create: `frontend/src/canvas/NodeTypes/InfrastructureNodes.tsx`
- Create: `frontend/src/canvas/NodeTypes/ComputeNodes.tsx`
- Create: `frontend/src/canvas/NodeTypes/DataNodes.tsx`
- Create: `frontend/src/canvas/NodeTypes/ExternalNodes.tsx`
- Create: `frontend/src/canvas/NodeTypes/CloudNodes.tsx`
- Create: `frontend/src/canvas/NodeTypes/ConceptNodes.tsx`
- Create: `frontend/src/canvas/NodeTypes/CustomNode.tsx`
- Create: `frontend/src/canvas/NodeTypes/index.ts`

- [ ] **Step 1: Create BaseNode.tsx**

```typescript
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

interface BaseNodeProps {
  data: DiagramNodeData;
  selected: boolean;
  icon: React.ReactNode;
  color?: string;
}

export default function BaseNode({ data, selected, icon, color }: BaseNodeProps) {
  const borderColor = color ?? data.color ?? '#6366f1';

  return (
    <div
      className={`relative flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-800 border-2 min-w-[100px] cursor-grab ${
        selected ? 'shadow-lg shadow-indigo-500/30' : ''
      }`}
      style={{ borderColor }}
    >
      <NodeResizer minWidth={80} minHeight={60} isVisible={selected} color={borderColor} />

      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

      <div className="text-2xl">{icon}</div>

      <span
        className="text-xs text-slate-200 text-center font-medium max-w-[120px] truncate"
        title={data.label}
      >
        {data.label}
      </span>

      {data.technology && (
        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
          {data.technology}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  );
}
```

- [ ] **Step 2: Create InfrastructureNodes.tsx**

```typescript
import { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'load-balancer': '⚖️',
  cdn: '🌐',
  dns: '📡',
  firewall: '🔥',
  vpn: '🔒',
};

function makeInfraNode(type: string, defaultColor: string) {
  return function InfraNode({ data, selected }: NodeProps<DiagramNodeData>) {
    return <BaseNode data={data} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const LoadBalancerNode = makeInfraNode('load-balancer', '#f59e0b');
export const CdnNode = makeInfraNode('cdn', '#06b6d4');
export const DnsNode = makeInfraNode('dns', '#8b5cf6');
export const FirewallNode = makeInfraNode('firewall', '#ef4444');
export const VpnNode = makeInfraNode('vpn', '#10b981');
```

- [ ] **Step 3: Create ComputeNodes.tsx**

```typescript
import { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  microservice: '⚙️',
  server: '🖥️',
  serverless: '⚡',
  container: '📦',
};

function makeComputeNode(type: string, defaultColor: string) {
  return function ComputeNode({ data, selected }: NodeProps<DiagramNodeData>) {
    return <BaseNode data={data} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const MicroserviceNode = makeComputeNode('microservice', '#6366f1');
export const ServerNode = makeComputeNode('server', '#64748b');
export const ServerlessNode = makeComputeNode('serverless', '#f59e0b');
export const ContainerNode = makeComputeNode('container', '#06b6d4');
```

- [ ] **Step 4: Create DataNodes.tsx**

```typescript
import { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'sql-db': '🗄️',
  'nosql-db': '📋',
  cache: '⚡',
  'message-queue': '📬',
  'data-warehouse': '🏪',
  'object-storage': '🪣',
};

function makeDataNode(type: string, defaultColor: string) {
  return function DataNode({ data, selected }: NodeProps<DiagramNodeData>) {
    return <BaseNode data={data} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const SqlDbNode = makeDataNode('sql-db', '#3b82f6');
export const NoSqlDbNode = makeDataNode('nosql-db', '#10b981');
export const CacheNode = makeDataNode('cache', '#f59e0b');
export const MessageQueueNode = makeDataNode('message-queue', '#8b5cf6');
export const DataWarehouseNode = makeDataNode('data-warehouse', '#06b6d4');
export const ObjectStorageNode = makeDataNode('object-storage', '#64748b');
```

- [ ] **Step 5: Create ExternalNodes.tsx**

```typescript
import { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'client-web': '🖥️',
  'client-mobile': '📱',
  'third-party-api': '🔌',
  'telegram-bot': '🤖',
};

function makeExternalNode(type: string, defaultColor: string) {
  return function ExternalNode({ data, selected }: NodeProps<DiagramNodeData>) {
    return <BaseNode data={data} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const ClientWebNode = makeExternalNode('client-web', '#94a3b8');
export const ClientMobileNode = makeExternalNode('client-mobile', '#94a3b8');
export const ThirdPartyApiNode = makeExternalNode('third-party-api', '#f97316');
export const TelegramBotNode = makeExternalNode('telegram-bot', '#0ea5e9');
```

- [ ] **Step 6: Create CloudNodes.tsx**

```typescript
import { NodeProps, NodeResizer } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

// Cloud nodes are group/boundary nodes — no handles, just a labelled box
function CloudGroupNode({ data, selected }: NodeProps<DiagramNodeData>) {
  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 min-w-[200px] min-h-[150px] bg-slate-900/50 ${
        selected ? 'border-blue-400' : 'border-slate-600'
      }`}
    >
      <NodeResizer minWidth={150} minHeight={100} isVisible={selected} color="#3b82f6" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {data.label}
      </span>
    </div>
  );
}

export const CloudRegionNode = CloudGroupNode;
export const AvailabilityZoneNode = CloudGroupNode;
```

- [ ] **Step 7: Create ConceptNodes.tsx**

```typescript
import { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'rate-limiter': '🚦',
  'api-gateway': '🚪',
  'service-mesh': '🕸️',
};

function makeConceptNode(type: string, defaultColor: string) {
  return function ConceptNode({ data, selected }: NodeProps<DiagramNodeData>) {
    return <BaseNode data={data} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const RateLimiterNode = makeConceptNode('rate-limiter', '#f59e0b');
export const ApiGatewayNode = makeConceptNode('api-gateway', '#8b5cf6');
export const ServiceMeshNode = makeConceptNode('service-mesh', '#10b981');
```

- [ ] **Step 8: Create CustomNode.tsx**

```typescript
import { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

export function CustomNodeComponent({ data, selected }: NodeProps<DiagramNodeData>) {
  const icon = data.color ? '🔷' : '⬜';
  return <BaseNode data={data} selected={selected} icon={icon} color={data.color ?? '#6366f1'} />;
}
```

- [ ] **Step 9: Create NodeTypes/index.ts — register all node types with React Flow**

```typescript
import { LoadBalancerNode, CdnNode, DnsNode, FirewallNode, VpnNode } from './InfrastructureNodes';
import { MicroserviceNode, ServerNode, ServerlessNode, ContainerNode } from './ComputeNodes';
import { SqlDbNode, NoSqlDbNode, CacheNode, MessageQueueNode, DataWarehouseNode, ObjectStorageNode } from './DataNodes';
import { ClientWebNode, ClientMobileNode, ThirdPartyApiNode, TelegramBotNode } from './ExternalNodes';
import { CloudRegionNode, AvailabilityZoneNode } from './CloudNodes';
import { RateLimiterNode, ApiGatewayNode, ServiceMeshNode } from './ConceptNodes';
import { CustomNodeComponent } from './CustomNode';

export const NODE_TYPES = {
  'load-balancer': LoadBalancerNode,
  'cdn': CdnNode,
  'dns': DnsNode,
  'firewall': FirewallNode,
  'vpn': VpnNode,
  'microservice': MicroserviceNode,
  'server': ServerNode,
  'serverless': ServerlessNode,
  'container': ContainerNode,
  'sql-db': SqlDbNode,
  'nosql-db': NoSqlDbNode,
  'cache': CacheNode,
  'message-queue': MessageQueueNode,
  'data-warehouse': DataWarehouseNode,
  'object-storage': ObjectStorageNode,
  'client-web': ClientWebNode,
  'client-mobile': ClientMobileNode,
  'third-party-api': ThirdPartyApiNode,
  'telegram-bot': TelegramBotNode,
  'cloud-region': CloudRegionNode,
  'availability-zone': AvailabilityZoneNode,
  'rate-limiter': RateLimiterNode,
  'api-gateway': ApiGatewayNode,
  'service-mesh': ServiceMeshNode,
  'custom': CustomNodeComponent,
} as const;

export const PALETTE_CATEGORIES = [
  {
    name: 'Infrastructure',
    nodes: [
      { type: 'load-balancer', label: 'Load Balancer' },
      { type: 'cdn', label: 'CDN' },
      { type: 'dns', label: 'DNS' },
      { type: 'firewall', label: 'Firewall' },
      { type: 'vpn', label: 'VPN' },
    ],
  },
  {
    name: 'Compute',
    nodes: [
      { type: 'microservice', label: 'Microservice' },
      { type: 'server', label: 'Server' },
      { type: 'serverless', label: 'Serverless' },
      { type: 'container', label: 'Container' },
    ],
  },
  {
    name: 'Data',
    nodes: [
      { type: 'sql-db', label: 'SQL DB' },
      { type: 'nosql-db', label: 'NoSQL DB' },
      { type: 'cache', label: 'Cache' },
      { type: 'message-queue', label: 'Message Queue' },
      { type: 'data-warehouse', label: 'Data Warehouse' },
      { type: 'object-storage', label: 'Object Storage' },
    ],
  },
  {
    name: 'External',
    nodes: [
      { type: 'client-web', label: 'Web Client' },
      { type: 'client-mobile', label: 'Mobile Client' },
      { type: 'third-party-api', label: 'Third-party API' },
      { type: 'telegram-bot', label: 'Telegram Bot' },
    ],
  },
  {
    name: 'Cloud',
    nodes: [
      { type: 'cloud-region', label: 'Cloud Region' },
      { type: 'availability-zone', label: 'Availability Zone' },
    ],
  },
  {
    name: 'Concepts',
    nodes: [
      { type: 'rate-limiter', label: 'Rate Limiter' },
      { type: 'api-gateway', label: 'API Gateway' },
      { type: 'service-mesh', label: 'Service Mesh' },
    ],
  },
] as const;
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/canvas/NodeTypes/
git commit -m "feat: add all canvas node type components and palette registry"
```

---

## PHASE 4 — Palette

### Task 13: Palette components

**Files:**
- Create: `frontend/src/canvas/Palette/PaletteItem.tsx`
- Create: `frontend/src/canvas/Palette/PaletteCategory.tsx`
- Create: `frontend/src/canvas/Palette/Palette.tsx`
- Create: `frontend/src/canvas/Palette/CustomNodeManager.tsx`

- [ ] **Step 1: Create PaletteItem.tsx**

```typescript
import type { NodeType } from '@shared/types';

interface PaletteItemProps {
  type: NodeType;
  label: string;
}

export default function PaletteItem({ type, label }: PaletteItemProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow-type', type);
    e.dataTransfer.setData('application/reactflow-label', label);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 cursor-grab text-sm text-slate-200 select-none"
    >
      <span className="text-base">⬜</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create PaletteCategory.tsx**

```typescript
import { useState } from 'react';
import PaletteItem from './PaletteItem';
import type { NodeType } from '@shared/types';

interface PaletteCategoryProps {
  name: string;
  nodes: ReadonlyArray<{ type: string; label: string }>;
}

export default function PaletteCategory({ name, nodes }: PaletteCategoryProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
        onClick={() => setOpen(prev => !prev)}
      >
        {name}
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-1 mt-1">
          {nodes.map(node => (
            <PaletteItem key={node.type} type={node.type as NodeType} label={node.label} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create Palette.tsx**

```typescript
import PaletteCategory from './PaletteCategory';
import { PALETTE_CATEGORIES } from '../NodeTypes';

interface PaletteProps {
  onAddCustom: () => void;
}

export default function Palette({ onAddCustom }: PaletteProps) {
  return (
    <div className="w-56 h-full bg-slate-900 border-r border-slate-700 overflow-y-auto p-3 flex flex-col gap-1">
      <h2 className="text-sm font-bold text-slate-200 mb-3">Components</h2>

      {PALETTE_CATEGORIES.map(category => (
        <PaletteCategory key={category.name} name={category.name} nodes={category.nodes} />
      ))}

      <div className="mt-4 border-t border-slate-700 pt-3">
        <button
          onClick={onAddCustom}
          className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-800 rounded-md"
        >
          + Add Custom Node
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create CustomNodeManager.tsx**

```typescript
import { useState } from 'react';
import { canvasApi } from '../../services/canvasApi';

interface CustomNodeManagerProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CustomNodeManager({ onClose, onCreated }: CustomNodeManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await canvasApi.createCustomNodeType({ name: name.trim(), color, description: description.trim() || undefined });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create node type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 border border-slate-600">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Create Custom Node Type</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name *</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kafka Cluster"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Color</label>
            <input
              type="color"
              className="w-12 h-8 rounded cursor-pointer"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/canvas/Palette/
git commit -m "feat: add palette components with drag-to-canvas support"
```

---

## PHASE 5 — Canvas Board

### Task 14: useCanvas hook with tests

**Files:**
- Create: `frontend/src/canvas/Board/useCanvas.ts`
- Create: `frontend/src/canvas/Board/__tests__/useCanvas.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/canvas/Board/__tests__/useCanvas.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../services/canvasApi', () => ({
  canvasApi: {
    saveDiagram: vi.fn().mockResolvedValue(undefined),
    getDiagram: vi.fn().mockResolvedValue({
      id: 'diag-1', name: 'Test', nodes: [], edges: [], createdAt: '', updatedAt: '',
    }),
  },
}));

vi.mock('@xyflow/react', () => ({
  useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useReactFlow: vi.fn(() => ({ getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })) })),
}));

import { useCanvas } from '../useCanvas';
import { canvasApi } from '../../../services/canvasApi';

beforeEach(() => vi.clearAllMocks());

describe('useCanvas', () => {
  it('initialises with idle save status', () => {
    const { result } = renderHook(() => useCanvas('diag-1'));
    expect(result.current.saveStatus).toBe('idle');
  });

  it('calls saveDiagram after triggerSave is called', async () => {
    const { result } = renderHook(() => useCanvas('diag-1'));
    await act(async () => {
      result.current.triggerSave();
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    expect(canvasApi.saveDiagram).toHaveBeenCalledWith('diag-1', expect.any(Object));
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/itayos/mygit/scramble-stack/frontend
npx vitest run src/canvas/Board/__tests__/useCanvas.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement useCanvas.ts**

Create `frontend/src/canvas/Board/useCanvas.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState, useReactFlow, type Node, type Edge, type OnNodesChange, type OnEdgesChange } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramNodeData } from '@shared/types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseCanvasReturn {
  nodes: Node<DiagramNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<DiagramNodeData>>;
  onEdgesChange: OnEdgesChange;
  setNodes: (nodes: Node<DiagramNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  saveStatus: SaveStatus;
  diagramName: string;
  setDiagramName: (name: string) => void;
  triggerSave: () => void;
}

const DEBOUNCE_MS = 1500;

export function useCanvas(diagramId: string): UseCanvasReturn {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DiagramNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [diagramName, setDiagramName] = useState('Untitled Diagram');
  const { getViewport } = useReactFlow();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    canvasApi.getDiagram(diagramId).then(diagram => {
      setNodes(diagram.nodes as Node<DiagramNodeData>[]);
      setEdges(diagram.edges as Edge[]);
      setDiagramName(diagram.name);
    });
  }, [diagramId]);

  const performSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      let thumbnail: string | null = null;
      const canvasEl = document.querySelector('.react-flow') as HTMLElement | null;
      if (canvasEl) {
        try {
          thumbnail = await toPng(canvasEl, { quality: 0.6, width: 400, height: 250 });
        } catch {
          // thumbnail generation is best-effort
        }
      }

      await canvasApi.saveDiagram(diagramId, {
        name: diagramName,
        nodes,
        edges,
        viewport: getViewport(),
        thumbnail,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [diagramId, diagramName, nodes, edges, getViewport]);

  const triggerSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(performSave, DEBOUNCE_MS);
  }, [performSave]);

  // Auto-save on nodes/edges change
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    triggerSave();
  }, [nodes, edges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    saveStatus,
    diagramName,
    setDiagramName,
    triggerSave,
  };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/canvas/Board/__tests__/useCanvas.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/canvas/Board/useCanvas.ts frontend/src/canvas/Board/__tests__/
git commit -m "feat: add useCanvas hook with debounced auto-save and thumbnail generation"
```

---

### Task 15: CanvasBoard and controls

**Files:**
- Create: `frontend/src/canvas/Board/CanvasBoard.tsx`
- Create: `frontend/src/canvas/Board/CanvasControls.tsx`
- Create: `frontend/src/canvas/Board/SelectionToolbar.tsx`

- [ ] **Step 1: Create CanvasControls.tsx**

```typescript
import { useReactFlow } from '@xyflow/react';

export default function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      <button
        onClick={() => zoomIn()}
        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-lg flex items-center justify-center"
        title="Zoom in"
      >+</button>
      <button
        onClick={() => zoomOut()}
        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-lg flex items-center justify-center"
        title="Zoom out"
      >−</button>
      <button
        onClick={() => fitView({ padding: 0.1 })}
        className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-xs flex items-center justify-center"
        title="Fit view"
      >⊡</button>
    </div>
  );
}
```

- [ ] **Step 2: Create SelectionToolbar.tsx**

```typescript
import { useReactFlow } from '@xyflow/react';

interface SelectionToolbarProps {
  selectedNodeId: string | null;
}

export default function SelectionToolbar({ selectedNodeId }: SelectionToolbarProps) {
  const { setNodes, deleteElements } = useReactFlow();

  if (!selectedNodeId) return null;

  const deleteSelected = () => {
    deleteElements({ nodes: [{ id: selectedNodeId }] });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 z-10">
      <button
        onClick={deleteSelected}
        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-slate-700"
      >
        Delete
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create CanvasBoard.tsx**

```typescript
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  MiniMap,
  ReactFlowProvider,
  type Node,
  type OnConnect,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_TYPES } from '../NodeTypes';
import { useCanvas } from './useCanvas';
import CanvasControls from './CanvasControls';
import SelectionToolbar from './SelectionToolbar';
import Palette from '../Palette/Palette';
import Toolbar from '../Toolbar/Toolbar';
import AIGeneratorPanel from '../AIGenerator/AIGeneratorPanel';
import CustomNodeManager from '../Palette/CustomNodeManager';
import type { DiagramNodeData, NodeType } from '@shared/types';

function CanvasBoardInner() {
  const { id } = useParams<{ id: string }>();
  const {
    nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges,
    saveStatus, diagramName, setDiagramName, triggerSave,
  } = useCanvas(id!);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [showCustomManager, setShowCustomManager] = useState(false);

  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type') as NodeType;
      const label = e.dataTransfer.getData('application/reactflow-label');
      if (!type) return;

      const bounds = e.currentTarget.getBoundingClientRect();
      const position = { x: e.clientX - bounds.left - 50, y: e.clientY - bounds.top - 30 };

      const newNode: Node<DiagramNodeData> = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label, nodeType: type },
      };

      setNodes(nds => [...nds, newNode]);
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-900">
      <Palette onAddCustom={() => setShowCustomManager(true)} />

      <div className="flex-1 flex flex-col">
        <Toolbar
          diagramName={diagramName}
          onNameChange={setDiagramName}
          saveStatus={saveStatus}
          onSave={triggerSave}
          onToggleAI={() => setShowAI(prev => !prev)}
          diagramId={id!}
          nodes={nodes}
          edges={edges}
        />

        <div
          className="flex-1 relative"
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            fitView
          >
            <Background color="#1e293b" gap={24} />
            <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,0.5)" />
            <CanvasControls />
            <SelectionToolbar selectedNodeId={selectedNodeId} />
          </ReactFlow>
        </div>
      </div>

      {showAI && (
        <AIGeneratorPanel
          onClose={() => setShowAI(false)}
          onNodesGenerated={(newNodes, newEdges, name) => {
            setNodes(newNodes);
            setEdges(newEdges);
            setDiagramName(name);
          }}
        />
      )}

      {showCustomManager && (
        <CustomNodeManager
          onClose={() => setShowCustomManager(false)}
          onCreated={() => setShowCustomManager(false)}
        />
      )}
    </div>
  );
}

export default function CanvasBoard() {
  return (
    <ReactFlowProvider>
      <CanvasBoardInner />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/canvas/Board/
git commit -m "feat: add CanvasBoard with drag-and-drop, connections, palette, and AI panel slot"
```

---

## PHASE 6 — Toolbar & Versioning

### Task 16: Toolbar, export, and version history

**Files:**
- Create: `frontend/src/canvas/Toolbar/Toolbar.tsx`
- Create: `frontend/src/canvas/Toolbar/UndoRedoButtons.tsx`
- Create: `frontend/src/canvas/Toolbar/ExportMenu.tsx`
- Create: `frontend/src/canvas/Toolbar/VersionHistory.tsx`

- [ ] **Step 1: Create UndoRedoButtons.tsx**

```typescript
import { useReactFlow } from '@xyflow/react';

export default function UndoRedoButtons() {
  // React Flow v12 has built-in undo/redo via keyboard (Ctrl+Z / Ctrl+Y)
  // This component surfaces them as buttons
  const handleUndo = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
  const handleRedo = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }));

  return (
    <div className="flex gap-1">
      <button onClick={handleUndo} className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded" title="Undo (Ctrl+Z)">↩</button>
      <button onClick={handleRedo} className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded" title="Redo (Ctrl+Y)">↪</button>
    </div>
  );
}
```

- [ ] **Step 2: Create ExportMenu.tsx**

```typescript
import { useState, useRef } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { canvasApi } from '../../services/canvasApi';

interface ExportMenuProps {
  diagramId: string;
  diagramName: string;
}

export default function ExportMenu({ diagramId, diagramName }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportAs = async (format: 'png' | 'svg' | 'json') => {
    setOpen(false);
    setExporting(true);
    setError(null);

    try {
      const canvasEl = document.querySelector('.react-flow') as HTMLElement | null;
      if (!canvasEl && format !== 'json') {
        setError('Export failed, try zooming out first');
        return;
      }

      if (format === 'png') {
        const dataUrl = await toPng(canvasEl!, { quality: 0.95 }).catch(() => { throw new Error('Export failed, try zooming out first'); });
        triggerDownload(dataUrl, `${diagramName}.png`);
      } else if (format === 'svg') {
        const dataUrl = await toSvg(canvasEl!).catch(() => { throw new Error('Export failed, try zooming out first'); });
        triggerDownload(dataUrl, `${diagramName}.svg`);
      } else {
        const data = await canvasApi.exportDiagram(diagramId);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        triggerDownload(URL.createObjectURL(blob), `${diagramName}.json`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={exporting}
        className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Export ↓'}
      </button>

      {error && <span className="absolute -bottom-6 right-0 text-xs text-red-400 whitespace-nowrap">{error}</span>}

      {open && (
        <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-20">
          {(['png', 'svg', 'json'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => exportAs(fmt)}
              className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 uppercase"
            >
              {fmt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create VersionHistory.tsx**

```typescript
import { useState, useEffect } from 'react';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramVersionMeta } from '@shared/types';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

interface VersionHistoryProps {
  diagramId: string;
  onRestore: (nodes: Node<DiagramNodeData>[], edges: Edge[]) => void;
  onClose: () => void;
}

export default function VersionHistory({ diagramId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DiagramVersionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    canvasApi.listVersions(diagramId)
      .then(setVersions)
      .catch(() => setError('Failed to load versions'))
      .finally(() => setLoading(false));
  }, [diagramId]);

  const restore = async (version: number) => {
    setRestoring(version);
    setError(null);
    try {
      const diagram = await canvasApi.restoreVersion(diagramId, version);
      onRestore(diagram.nodes as Node<DiagramNodeData>[], diagram.edges as Edge[]);
      onClose();
    } catch {
      setError(`Failed to restore version ${version}`);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 max-h-[70vh] flex flex-col border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100">Version History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading versions...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && versions.length === 0 && (
          <p className="text-sm text-slate-400">No saved versions yet. Versions are created automatically every 10 saves.</p>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto">
          {versions.map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-200">Version {v.version}</span>
                <p className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => restore(v.version)}
                disabled={restoring === v.version}
                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:opacity-50"
              >
                {restoring === v.version ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Toolbar.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';
import type { SaveStatus } from '../Board/useCanvas';
import UndoRedoButtons from './UndoRedoButtons';
import ExportMenu from './ExportMenu';
import VersionHistory from './VersionHistory';

interface ToolbarProps {
  diagramName: string;
  onNameChange: (name: string) => void;
  saveStatus: SaveStatus;
  onSave: () => void;
  onToggleAI: () => void;
  diagramId: string;
  nodes: Node<DiagramNodeData>[];
  edges: Edge[];
}

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Save failed — retry',
};

const SAVE_STATUS_COLORS: Record<SaveStatus, string> = {
  idle: 'text-slate-500',
  saving: 'text-slate-400',
  saved: 'text-green-400',
  error: 'text-red-400',
};

export default function Toolbar({
  diagramName, onNameChange, saveStatus, onSave, onToggleAI, diagramId, nodes, edges,
}: ToolbarProps) {
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const handleRestoreVersion = (restoredNodes: Node<DiagramNodeData>[], restoredEdges: Edge[]) => {
    // Trigger a re-render via the parent — CanvasBoard wires this up
    // For now, reload the page to get the restored state from DB
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border-b border-slate-700 h-12">
        <button
          onClick={() => navigate('/canvas')}
          className="text-slate-400 hover:text-slate-200 text-sm"
          title="Back to diagrams"
        >
          ←
        </button>

        {editingName ? (
          <input
            autoFocus
            className="bg-slate-700 border border-slate-500 rounded px-2 py-0.5 text-sm text-slate-100 w-48"
            value={diagramName}
            onChange={e => onNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
          />
        ) : (
          <span
            className="text-sm font-semibold text-slate-100 cursor-pointer hover:text-indigo-300"
            onDoubleClick={() => setEditingName(true)}
            title="Double-click to rename"
          >
            {diagramName}
          </span>
        )}

        <span className={`text-xs ${SAVE_STATUS_COLORS[saveStatus]}`}>
          {SAVE_STATUS_LABELS[saveStatus]}
          {saveStatus === 'error' && (
            <button onClick={onSave} className="ml-1 underline">retry</button>
          )}
        </span>

        <div className="flex-1" />

        <UndoRedoButtons />

        <button
          onClick={() => setShowVersions(true)}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md"
        >
          History
        </button>

        <button
          onClick={onToggleAI}
          className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md"
        >
          ✨ AI Generate
        </button>

        <ExportMenu diagramId={diagramId} diagramName={diagramName} />
      </div>

      {showVersions && (
        <VersionHistory
          diagramId={diagramId}
          onRestore={handleRestoreVersion}
          onClose={() => setShowVersions(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/canvas/Toolbar/
git commit -m "feat: add Toolbar with name editing, save status, export, undo/redo, and version history"
```

---

## PHASE 7 — AI Generator

### Task 17: useAIGenerator with tests and AIGeneratorPanel

**Files:**
- Create: `frontend/src/canvas/AIGenerator/useAIGenerator.ts`
- Create: `frontend/src/canvas/AIGenerator/__tests__/useAIGenerator.test.ts`
- Create: `frontend/src/canvas/AIGenerator/GenerationProgress.tsx`
- Create: `frontend/src/canvas/AIGenerator/AIGeneratorPanel.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/canvas/AIGenerator/__tests__/useAIGenerator.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockStreamGenerate = vi.fn();
vi.mock('../../../services/canvasApi', () => ({
  canvasApi: { streamGenerate: mockStreamGenerate },
}));

import { useAIGenerator } from '../useAIGenerator';

beforeEach(() => vi.clearAllMocks());

describe('useAIGenerator', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useAIGenerator());
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.streamedNodes).toHaveLength(0);
  });

  it('appends nodes as they stream in', async () => {
    const node = { id: 'n1', type: 'microservice', position: { x: 0, y: 0 }, data: { label: 'Service', nodeType: 'microservice' } };

    mockStreamGenerate.mockImplementation(async (_prompt, onNode, _onEdge, _onMeta, onDone) => {
      onNode(node);
      onDone();
    });

    const { result } = renderHook(() => useAIGenerator());
    await act(async () => {
      await result.current.generate('design a simple app');
    });

    expect(result.current.streamedNodes).toHaveLength(1);
    expect(result.current.isGenerating).toBe(false);
  });

  it('sets error on stream failure', async () => {
    mockStreamGenerate.mockImplementation(async (_p, _n, _e, _m, _d, onError) => {
      onError('Generation failed. Please try again.');
    });

    const { result } = renderHook(() => useAIGenerator());
    await act(async () => {
      await result.current.generate('bad prompt');
    });

    expect(result.current.error).toBe('Generation failed. Please try again.');
    expect(result.current.isGenerating).toBe(false);
  });

  it('cancel stops the stream and retains partial nodes', async () => {
    const node = { id: 'n1', type: 'microservice', position: { x: 0, y: 0 }, data: { label: 'A', nodeType: 'microservice' } };

    mockStreamGenerate.mockImplementation(async (_p, onNode) => {
      onNode(node);
      // never calls onDone — simulates a cancel-interrupted stream
      await new Promise(() => {}); // hang forever
    });

    const { result } = renderHook(() => useAIGenerator());

    act(() => { result.current.generate('test').catch(() => {}); });

    await act(async () => {
      result.current.cancel();
      await new Promise(r => setTimeout(r, 50));
    });

    expect(result.current.streamedNodes).toHaveLength(1); // partial node retained
    expect(result.current.isGenerating).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/canvas/AIGenerator/__tests__/useAIGenerator.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement useAIGenerator.ts**

Create `frontend/src/canvas/AIGenerator/useAIGenerator.ts`:

```typescript
import { useState, useRef, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramNodeData } from '@shared/types';

interface UseAIGeneratorReturn {
  isGenerating: boolean;
  streamedNodes: Node<DiagramNodeData>[];
  streamedEdges: Edge[];
  generatedMeta: { name: string; description: string } | null;
  error: string | null;
  generate: (prompt: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useAIGenerator(): UseAIGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedNodes, setStreamedNodes] = useState<Node<DiagramNodeData>[]>([]);
  const [streamedEdges, setStreamedEdges] = useState<Edge[]>([]);
  const [generatedMeta, setGeneratedMeta] = useState<{ name: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const generate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setStreamedNodes([]);
    setStreamedEdges([]);
    setGeneratedMeta(null);
    cancelledRef.current = false;

    abortRef.current = new AbortController();

    try {
      await canvasApi.streamGenerate(
        prompt,
        node => {
          if (!cancelledRef.current) {
            setStreamedNodes(prev => [...prev, node as Node<DiagramNodeData>]);
          }
        },
        edge => {
          if (!cancelledRef.current) {
            setStreamedEdges(prev => [...prev, edge as Edge]);
          }
        },
        meta => setGeneratedMeta(meta),
        () => setIsGenerating(false),
        message => {
          setError(message);
          setIsGenerating(false);
        },
        abortRef.current.signal
      );
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      }
      setIsGenerating(false);
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setStreamedNodes([]);
    setStreamedEdges([]);
    setGeneratedMeta(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return { isGenerating, streamedNodes, streamedEdges, generatedMeta, error, generate, cancel, reset };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/canvas/AIGenerator/__tests__/useAIGenerator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Create GenerationProgress.tsx**

```typescript
interface GenerationProgressProps {
  nodeCount: number;
  isGenerating: boolean;
}

export default function GenerationProgress({ nodeCount, isGenerating }: GenerationProgressProps) {
  if (!isGenerating && nodeCount === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
      {isGenerating && <span className="animate-spin">⟳</span>}
      <span>
        {isGenerating
          ? `Placing nodes... (${nodeCount} placed)`
          : `Generation complete — ${nodeCount} nodes`}
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Create AIGeneratorPanel.tsx**

```typescript
import { useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';
import { useAIGenerator } from './useAIGenerator';
import GenerationProgress from './GenerationProgress';

interface AIGeneratorPanelProps {
  onClose: () => void;
  onNodesGenerated: (nodes: Node<DiagramNodeData>[], edges: Edge[], name: string) => void;
}

const EXAMPLE_PROMPTS = [
  'Design a ride-sharing app like Uber',
  'Design a social media feed service',
  'Design a URL shortener with high availability',
  'Design a video streaming service like Netflix',
];

export default function AIGeneratorPanel({ onClose, onNodesGenerated }: AIGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const { isGenerating, streamedNodes, streamedEdges, generatedMeta, error, generate, cancel } = useAIGenerator();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    await generate(prompt.trim());
  };

  const handleApply = () => {
    if (streamedNodes.length === 0) return;
    onNodesGenerated(streamedNodes, streamedEdges, generatedMeta?.name ?? 'Generated Diagram');
    onClose();
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-700 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-100">✨ AI Generate</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-100 resize-none h-24 placeholder-slate-500"
          placeholder="Describe the system you want to design..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={isGenerating}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
        />

        <div className="flex gap-2">
          {isGenerating ? (
            <button
              onClick={cancel}
              className="flex-1 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40"
            >
              Generate ⌘↵
            </button>
          )}
        </div>

        <GenerationProgress nodeCount={streamedNodes.length} isGenerating={isGenerating} />

        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {streamedNodes.length > 0 && !isGenerating && (
        <div className="flex flex-col gap-2">
          {generatedMeta && (
            <div className="text-xs text-slate-400 bg-slate-800 rounded-lg p-3">
              <p className="font-semibold text-slate-300">{generatedMeta.name}</p>
              <p className="mt-1">{generatedMeta.description}</p>
            </div>
          )}
          <button
            onClick={handleApply}
            className="w-full py-2 text-sm bg-green-700 hover:bg-green-600 text-white rounded-lg"
          >
            Apply to Canvas ({streamedNodes.length} nodes)
          </button>
        </div>
      )}

      <div className="mt-auto">
        <p className="text-xs text-slate-500 mb-2">Examples:</p>
        <div className="flex flex-col gap-1">
          {EXAMPLE_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => setPrompt(p)}
              className="text-left text-xs text-slate-400 hover:text-indigo-300 py-1"
            >
              → {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/canvas/AIGenerator/
git commit -m "feat: add AI generator panel with SSE streaming and cancel support"
```

---

## PHASE 8 — Diagram List

### Task 18: DiagramList, DiagramCard, useDiagramList with tests

**Files:**
- Create: `frontend/src/canvas/DiagramList/useDiagramList.ts`
- Create: `frontend/src/canvas/DiagramList/__tests__/useDiagramList.test.ts`
- Create: `frontend/src/canvas/DiagramList/DiagramCard.tsx`
- Create: `frontend/src/canvas/DiagramList/DiagramList.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/canvas/DiagramList/__tests__/useDiagramList.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockApi = {
  listDiagrams: vi.fn(),
  createDiagram: vi.fn(),
  deleteDiagram: vi.fn(),
};

vi.mock('../../../services/canvasApi', () => ({ canvasApi: mockApi }));

import { useDiagramList } from '../useDiagramList';

const mockDiagrams = [
  { id: '1', name: 'System A', createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: '2', name: 'System B', createdAt: '2026-04-02T00:00:00Z', updatedAt: '2026-04-02T00:00:00Z' },
];

beforeEach(() => vi.clearAllMocks());

describe('useDiagramList', () => {
  it('loads diagrams on mount', async () => {
    mockApi.listDiagrams.mockResolvedValue(mockDiagrams);
    const { result } = renderHook(() => useDiagramList());

    await act(async () => await new Promise(r => setTimeout(r, 50)));

    expect(result.current.diagrams).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it('creates a new diagram and refreshes list', async () => {
    mockApi.listDiagrams.mockResolvedValue(mockDiagrams);
    mockApi.createDiagram.mockResolvedValue({ id: '3', name: 'New Diagram' });

    const { result } = renderHook(() => useDiagramList());
    await act(async () => {
      await result.current.createDiagram('New Diagram');
    });

    expect(mockApi.createDiagram).toHaveBeenCalledWith('New Diagram');
    expect(mockApi.listDiagrams).toHaveBeenCalledTimes(2); // initial + after create
  });

  it('deletes a diagram and removes it from state', async () => {
    mockApi.listDiagrams.mockResolvedValue(mockDiagrams);
    mockApi.deleteDiagram.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDiagramList());
    await act(async () => await new Promise(r => setTimeout(r, 50)));

    await act(async () => {
      await result.current.deleteDiagram('1');
    });

    expect(result.current.diagrams.find(d => d.id === '1')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/canvas/DiagramList/__tests__/useDiagramList.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement useDiagramList.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramMeta } from '../../services/canvasApi';

interface UseDiagramListReturn {
  diagrams: DiagramMeta[];
  loading: boolean;
  error: string | null;
  createDiagram: (name: string) => Promise<string>;
  deleteDiagram: (id: string) => Promise<void>;
  refresh: () => void;
}

export function useDiagramList(): UseDiagramListReturn {
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await canvasApi.listDiagrams();
      setDiagrams(result);
    } catch {
      setError('Could not load diagrams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createDiagram = async (name: string): Promise<string> => {
    const diagram = await canvasApi.createDiagram(name);
    await load();
    return diagram.id;
  };

  const deleteDiagram = async (id: string): Promise<void> => {
    await canvasApi.deleteDiagram(id);
    setDiagrams(prev => prev.filter(d => d.id !== id));
  };

  return { diagrams, loading, error, createDiagram, deleteDiagram, refresh: load };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/canvas/DiagramList/__tests__/useDiagramList.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Create DiagramCard.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DiagramMeta } from '../../services/canvasApi';

interface DiagramCardProps {
  diagram: DiagramMeta;
  onDelete: (id: string) => void;
}

export default function DiagramCard({ diagram, onDelete }: DiagramCardProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(diagram.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className="relative group bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl overflow-hidden cursor-pointer transition-colors"
      onClick={() => navigate(`/canvas/${diagram.id}`)}
    >
      <div className="h-36 bg-slate-900 flex items-center justify-center">
        {diagram.thumbnail ? (
          <img src={diagram.thumbnail} alt={diagram.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-20">🎨</span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-100 truncate">{diagram.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date(diagram.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-md bg-slate-700 hover:bg-red-700 text-slate-300 hover:text-white transition-all"
        title={confirmDelete ? 'Click again to confirm' : 'Delete diagram'}
      >
        {confirmDelete ? 'Sure?' : '🗑'}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create DiagramList.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagramList } from './useDiagramList';
import DiagramCard from './DiagramCard';

export default function DiagramList() {
  const navigate = useNavigate();
  const { diagrams, loading, error, createDiagram, deleteDiagram } = useDiagramList();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createDiagram(newName.trim());
      navigate(`/canvas/${id}`);
    } finally {
      setCreating(false);
      setNewName('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">ScrambleStack</h1>
            <p className="text-sm text-slate-400 mt-1">System Design Canvas</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 w-48 placeholder-slate-500"
              placeholder="New diagram name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40"
            >
              {creating ? 'Creating...' : '+ New Diagram'}
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-slate-400 text-sm">Loading diagrams...</p>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-400">
            {error} — <button onClick={() => window.location.reload()} className="underline">Retry</button>
          </div>
        )}

        {!loading && !error && diagrams.length === 0 && (
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">🎨</p>
            <p className="text-lg">No diagrams yet</p>
            <p className="text-sm mt-1">Create your first system design diagram above</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {diagrams.map(diagram => (
            <DiagramCard key={diagram.id} diagram={diagram} onDelete={deleteDiagram} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/canvas/DiagramList/
git commit -m "feat: add DiagramList page with create/delete and thumbnail preview"
```

---

## PHASE 9 — Integration & Smoke Test

### Task 19: Run all tests and verify full suite passes

- [ ] **Step 1: Run backend tests**

```bash
cd /Users/itayos/mygit/scramble-stack/backend
npx vitest run
```

Expected output:
```
✓ src/canvas/services/__tests__/diagramService.test.ts (5 tests)
✓ src/canvas/services/__tests__/aiGeneratorService.test.ts (3 tests)
✓ src/canvas/services/__tests__/exportService.test.ts (2 tests)
```
All tests PASS. If any fail, fix before proceeding.

- [ ] **Step 2: Run frontend tests**

```bash
cd /Users/itayos/mygit/scramble-stack/frontend
npx vitest run
```

Expected output:
```
✓ src/canvas/Board/__tests__/useCanvas.test.ts (2 tests)
✓ src/canvas/AIGenerator/__tests__/useAIGenerator.test.ts (4 tests)
✓ src/canvas/DiagramList/__tests__/useDiagramList.test.ts (3 tests)
```
All tests PASS.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/itayos/mygit/scramble-stack/backend && npx tsc --noEmit
cd /Users/itayos/mygit/scramble-stack/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Start backend and verify health endpoint**

```bash
cd /Users/itayos/mygit/scramble-stack/backend
# Ensure .env has DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET
npm run dev
```

In another terminal:
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Start frontend and verify it loads**

```bash
cd /Users/itayos/mygit/scramble-stack/frontend
npm run dev
```

Open `http://localhost:5173/canvas` — should show the DiagramList page with "No diagrams yet".

- [ ] **Step 6: Final commit**

```bash
cd /Users/itayos/mygit/scramble-stack
git add .
git commit -m "feat: complete Canvas App (App A) — all phases implemented and tested"
```

---

## Summary of Phases

| Phase | Tasks | What it produces |
|---|---|---|
| 0 — Foundation | 1–4 | Monorepo scaffold, core services, shared types, Prisma schema |
| 1 — Backend | 5–10 | diagramService, aiGeneratorService, exportService, controller, routes, Express entry |
| 2 — Frontend Scaffold | 11 | Vite app, routing, canvasApi client |
| 3 — Node System | 12 | All 25 node types + palette registry |
| 4 — Palette | 13 | Drag-to-canvas palette sidebar + custom node manager |
| 5 — Board | 14–15 | useCanvas hook, CanvasBoard with React Flow, drop zones |
| 6 — Toolbar | 16 | Toolbar, undo/redo, export, version history |
| 7 — AI Generator | 17 | Streaming AI panel with cancel + example prompts |
| 8 — Diagram List | 18 | Home page with create/delete/thumbnail grid |
| 9 — Integration | 19 | Full test suite + smoke test |

**Natural stopping points:** End of any phase. All phases end with a commit. Resume by finding the first unchecked `- [ ]` step.
