# Evals

Structured quality evaluation harness for ScrambleStack's AI-powered endpoints.

## Suites

| Suite | Target | Notes |
|---|---|---|
| `canvas-generator` | `POST /api/canvas/generate` | SSE streaming, schema + Claude-as-judge |
| `qa-scoring` | `POST /api/sessions/:id/submit` | Monotonicity: high > mid > low answer scores |
| `news-curator` | `GET /api/feed` | Article presence + Claude-as-judge on insight quality |

## Usage

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export CANVAS_BACKEND_URL=http://localhost:3000
export NEWS_FEED_BACKEND_URL=http://localhost:3001
export QA_BACKEND_URL=http://localhost:3002

# Run one suite
npm run eval:canvas

# Run everything
npm run eval:all

# Capture the current report as the baseline
npm run baseline
```

Reports are written to `evals/reports/`:
- `latest.json` — most recent run
- `baseline-<suite>.json` — committed baseline; CI regresses if score drops > 5%

## CI

`.github/workflows/evaluate.yml` runs all suites nightly against the docker-compose stack.
