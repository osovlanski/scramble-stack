# Deployment

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
