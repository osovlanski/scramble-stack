# Project Memory

ScrambleStack is a monorepo of three engineering-practice apps: Canvas (AI-assisted architecture diagrams), News Feed (curated system-design content), and System Design Q&A (interview practice/scoring), linked by a hub.

- Frontends: React 18/Vite/TypeScript/Tailwind; Canvas uses React Flow.
- Backends: three Express/TypeScript services. Canvas uses Prisma 7/PostgreSQL/Redis/JWT; News Feed uses Prisma 5/SQLite and RSS/Claude; Q&A has mixed Prisma 7 SQLite/PostgreSQL adapter support, Redis/JWT and Claude.
- Shared: `shared/types.ts` and small UI utilities. AI eval harness under `evals`; Playwright/axe E2E under `e2e`.
- Entry points: each `apps/*/{backend,frontend}/src/index|main`; API controllers/routes by app.
- Deploy: Vercel frontends, Railway backends; Docker Compose for local stack; GitHub Actions for test/E2E/deploy/evaluation/keepalive.
- Runtime contract: Node 22/npm 10 (`.nvmrc` and root engines). CI performs a clean workspace install, fast verification, and blocks critical production advisories.
- Weaknesses: duplicated backend scaffolding/security/env handling; divergent Prisma major versions and persistence choices; Q&A frontend now has an explicit no-test-safe command but still needs behavioral coverage; six-process operational overhead; product cohesion is weak beyond “system design”.
- Portfolio: learning product. Its Q&A/whiteboard capabilities overlap Pocketknife's interview/problem-solving features, but its focused practice loop is more coherent.
- Open questions: actual usage by app; whether News Feed drives learning outcomes; intended canonical database for Q&A.
