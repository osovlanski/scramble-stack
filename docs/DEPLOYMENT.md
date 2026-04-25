# Deployment

## Status: why no production URL exists yet

The CI workflow on `main` reports **success** for every `Deploy *` job, but those
jobs are **skipping** — not running. Each deploy job starts with a guard step
that sets `skip=true` when the required GitHub Actions secret is missing, and
every subsequent step inherits the skip. The workflow exits clean, so the
overall run is green even though nothing was deployed.

To see this for yourself, open any recent CI run and expand a `Deploy * (Vercel)`
or `Deploy * (Railway)` job — the `Guard` step prints `::warning::… skipping deploy`
and steps 3..N show as `skipped`.

**No Vercel project or Railway service has ever been deployed from this repo.**
Follow [Step-by-step manual setup](#step-by-step-manual-setup) below to create them.

## Topology

```
                 ┌──────────── Vercel ────────────┐
                 │  canvas-frontend                │
                 │  news-feed-frontend             │
                 │  system-design-qa-frontend      │
                 └──────────── calls via HTTPS ────┘
                                  │
                 ┌──────────── Railway ───────────┐
                 │  canvas-backend (Postgres)      │
                 │  news-feed-backend (SQLite vol) │
                 │  system-design-qa-backend (vol) │
                 └─────────────────────────────────┘
```

## Required GitHub Actions secrets

| Secret | Purpose |
|---|---|
| `VERCEL_TOKEN` | Vercel CLI auth |
| `VERCEL_ORG_ID` | Shared across all three frontend projects |
| `VERCEL_CANVAS_PROJECT_ID` | Canvas frontend Vercel project |
| `VERCEL_NEWS_FEED_PROJECT_ID` | News feed frontend Vercel project |
| `VERCEL_SYSTEM_DESIGN_QA_PROJECT_ID` | QA frontend Vercel project |
| `RAILWAY_TOKEN` | Railway CLI auth (shared across backends) |
| `CANVAS_BACKEND_URL` | e.g. `https://canvas-backend.up.railway.app` (for keepalive pinger) |
| `NEWS_FEED_BACKEND_URL` | e.g. `https://news-feed-backend.up.railway.app` |
| `SYSTEM_DESIGN_QA_BACKEND_URL` | e.g. `https://system-design-qa-backend.up.railway.app` |

## Vercel project env vars (per frontend)

### Canvas frontend
| Var | Example |
|---|---|
| `VITE_CANVAS_API_URL` | `https://canvas-backend.up.railway.app/api` |
| `VITE_NEWS_FEED_URL` | `https://news-feed.yourdomain.com` |
| `VITE_SYSTEM_DESIGN_URL` | `https://qa.yourdomain.com` |

### News feed frontend
| Var | Example |
|---|---|
| `VITE_NEWS_FEED_API_URL` | `https://news-feed-backend.up.railway.app/api` |
| `VITE_CANVAS_URL` | `https://canvas.yourdomain.com` |
| `VITE_SYSTEM_DESIGN_URL` | `https://qa.yourdomain.com` |

### System Design QA frontend
| Var | Example |
|---|---|
| `VITE_SYSTEM_DESIGN_QA_API_URL` | `https://system-design-qa-backend.up.railway.app/api` |
| `VITE_CANVAS_URL` | `https://canvas.yourdomain.com` |
| `VITE_NEWS_FEED_URL` | `https://news-feed.yourdomain.com` |

## Railway service env vars

### canvas-backend
| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Provided by Railway Postgres plugin |
| `JWT_SECRET` | yes | 64-byte random |
| `ANTHROPIC_API_KEY` | yes | |
| `FRONTEND_URL` | yes | Canvas frontend Vercel URL — allowlisted by CORS |
| `ALLOWED_ORIGINS` | optional | Comma-separated CORS allowlist (adds news-feed + QA frontend URLs) |
| `REDIS_URL` | no | Falls back to in-memory cache |

### news-feed-backend
| Var | Required |
|---|---|
| `ANTHROPIC_API_KEY` | yes |
| `FRONTEND_URL` | yes |
| `NEWS_DATABASE_URL` | yes — `file:/data/news-feed.db` on Railway volume |

### system-design-qa-backend
| Var | Required |
|---|---|
| `ANTHROPIC_API_KEY` | yes |
| `CANVAS_BACKEND_URL` | yes — Canvas backend Railway URL (for diagram export fetches) |
| `FRONTEND_URL` | yes |
| `DATABASE_URL` | yes — `file:/data/qa.db` on Railway volume |

## Step-by-step manual setup

The CI workflow handles the actual deploy commands once secrets exist; the work
below is the one-time provisioning you cannot do from CI itself.

### A. Vercel — create 3 projects (one per frontend)

For each of `apps/canvas/frontend`, `apps/news-feed/frontend`,
`apps/system-design-qa/frontend`:

1. Go to https://vercel.com/new and import the `scramble-stack` GitHub repo.
2. **Root directory**: set to the frontend's path (e.g. `apps/canvas/frontend`).
3. **Framework preset**: Vite (auto-detected from `vercel.json`).
4. **Build command**: leave default — `npm run build` (set in `vercel.json`).
5. **Output directory**: leave default — `dist`.
6. **Install command** — change to:
   ```
   cd ../../.. && npm ci
   ```
   This is critical: the frontend imports from `@shared/*`, so install must
   run from the monorepo root or Vercel will not find the workspace deps.
7. **Environment variables**: set the per-frontend `VITE_*` variables listed
   in the table above (point them at your Railway URLs from step B).
8. Deploy. Copy the project's settings → ID into a GitHub secret —
   `VERCEL_CANVAS_PROJECT_ID` / `VERCEL_NEWS_FEED_PROJECT_ID` /
   `VERCEL_SYSTEM_DESIGN_QA_PROJECT_ID`.

Then once across all three:
- `VERCEL_TOKEN`: create at https://vercel.com/account/tokens and add as a repo
  secret in `Settings → Secrets and variables → Actions`.
- `VERCEL_ORG_ID`: in your Vercel team settings → General → Team ID.

### B. Railway — create 3 services (one per backend)

1. Create a new project at https://railway.app/new from the GitHub repo.
2. For each of the three backends, add a service:
   - **Service name**: must match the workflow exactly — `canvas-backend`,
     `news-feed-backend`, `system-design-qa-backend`. The workflow runs
     `railway up --service=<this-name>` and will fail otherwise.
   - **Source**: link the repo + set **Root Directory** to the backend path
     (e.g. `apps/canvas/backend`). Railway needs this so it builds the right
     workspace.
   - **Watch path**: leave default — Railway auto-rebuilds on push.
3. **Canvas-backend only**: add Railway's PostgreSQL plugin to the project,
   and copy its connection string into `canvas-backend` service env as
   `DATABASE_URL`.
4. **News-feed + QA backends**: add a 1 GB volume mounted at `/data` (these
   use SQLite and the schema expects `file:/data/*.db`).
5. Set env vars per the tables above. `JWT_SECRET` should be ≥32 chars random.
6. Once a service has deployed, copy its public URL (e.g.
   `https://canvas-backend-production.up.railway.app`) and:
   - Set `CANVAS_BACKEND_URL` on the `system-design-qa-backend` service.
   - Set the matching `VITE_*_API_URL` (with `/api` suffix) on the Vercel
     frontend project, then re-deploy that frontend.

Then once across all three:
- `RAILWAY_TOKEN`: create at https://railway.app/account/tokens with project
  scope, and add to the GitHub repo secrets.

### C. Verify the deploy actually runs

Push a no-op commit to `main`. In the GitHub Actions run, the deploy jobs
should now show `Deploy → Run` (success), not `skipped`. If they still skip,
open the `Guard` step output to see which secret name is still missing.

### Common monorepo pitfalls

- **Vercel install fails on `@shared/*` imports**: confirm install command is
  `cd ../../.. && npm ci`, not the default `npm ci` (which would run from the
  frontend root and miss the workspace).
- **Railway start command crashes immediately**: confirm
  `apps/<app>/backend/package.json` `start` points at the actual emitted JS path.
  `npm run verify:prod-build` (added 2026-04-25) catches this locally — it
  builds every workspace and asserts `start`'s path resolves. CI runs the same
  in the `prod-build` job.
- **Service name mismatch**: Railway service must be named exactly
  `canvas-backend`, `news-feed-backend`, `system-design-qa-backend` — the
  workflow's `--service=` flag is case-sensitive.

## First-time deploy checklist

1. Create 3 Vercel projects, each linked to the corresponding `apps/*/frontend` root. Copy each project ID into `VERCEL_*_PROJECT_ID` GitHub secrets.
2. Create 3 Railway services. Add a Postgres plugin for canvas-backend. Attach volumes at `/data` for news-feed-backend and system-design-qa-backend.
3. Set env vars per the tables above.
4. Push to `main` → CI runs tests, then deploys in parallel.
5. Set the Railway service URLs back into the corresponding Vercel frontend env vars (`VITE_*_API_URL`) and the `CANVAS_BACKEND_URL` on the QA backend.
6. Re-deploy.

## Custom domains (optional)

Point your DNS provider (e.g. Cloudflare) at Vercel for each frontend and at Railway for each backend. Suggested scheme:
- `canvas.yourdomain.com` → Vercel
- `news-feed.yourdomain.com` → Vercel
- `qa.yourdomain.com` → Vercel
- `api.canvas.yourdomain.com` → Railway
- `api.news-feed.yourdomain.com` → Railway
- `api.qa.yourdomain.com` → Railway

## Keepalive

`.github/workflows/keepalive.yml` pings each backend's `/health` every 10 minutes so Railway's free-tier cold starts don't leak into user sessions.
