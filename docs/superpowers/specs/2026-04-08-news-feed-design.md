# App B — Tech News Feed: Design Spec

**Date:** 2026-04-08  
**Status:** Approved  
**Scope:** New `news-feed/` workspace inside the scramble-stack monorepo

---

## Overview

A personal tech news feed that ingests articles from multiple sources, enriches them with a Claude "principal tech architect" persona (summary, theme tags, signal rating, adopt/watch/avoid action), and presents them as a scrollable live feed and a daily digest. Single-user, no auth required.

---

## Architecture

### Data Flow

```
── INGESTION (every 30 min) ──────────────────────────────────
sources.config.ts → SourceFetcher → raw articles stored in DB

  Sources:
  • RSS         — Calcalist, GeekTime (lang: he)
  • Reddit API  — r/ExperiencedDevs, r/systems, r/devops, r/MachineLearning
  • RSSHub      — Telegram channels (e.g. geektime_il), TikTok tags

── CURATION (after each ingestion) ──────────────────────────
CuratorService → Claude (tech-architect persona) → enriched articles

  Adds per article:
  • summary     — 2–3 sentence TL;DR
  • themes      — infra | ai-ml | security | frontend | data | cloud | culture | tooling
  • signal      — real | hype | noise
  • action      — adopt | watch | avoid | null
  • insight     — why this matters for system design / architecture
  • curatedAt   — timestamp

── PERSONALIZATION (continuous + weekly) ────────────────────
InteractionTracker → ArticleInteraction events in DB
PreferenceAgent (weekly + post-digest) → UserPreferenceProfile JSON

── DIGEST (daily at 07:00, configurable) ────────────────────
DigestScheduler → top-10 by personalScore → Claude briefing → DigestRecord in DB

── API ───────────────────────────────────────────────────────
Express :3001
  GET  /feed                      — paginated, filterable, ordered by personalScore
  GET  /digest                    — today's digest (or ?date=YYYY-MM-DD for past)
  POST /sources/refresh           — manual trigger
  POST /articles/:id/interact     — record explicit feedback (thumb_up/down/skip)
```

### Workspace Structure

```
scramble-stack/
├── shared/
├── backend/               ← canvas app (unchanged)
├── frontend/              ← canvas app (unchanged)
└── news-feed/
    ├── backend/
    │   ├── src/
    │   │   ├── sources/
    │   │   │   ├── fetcherRegistry.ts     ← maps source type → fetcher
    │   │   │   ├── rssFetcher.ts          ← Calcalist, GeekTime, any RSS
    │   │   │   ├── redditFetcher.ts       ← ported from pocketknife
    │   │   │   └── rsshubFetcher.ts       ← Telegram channels + TikTok
    │   │   ├── curator/
    │   │   │   └── curatorService.ts      ← Claude tech-architect persona
    │   │   ├── personalization/
    │   │   │   ├── interactionTracker.ts  ← records explicit + implicit events
    │   │   │   ├── preferenceAgent.ts     ← Claude agent that builds preference profile
    │   │   │   └── ranker.ts              ← applies profile weights → personalScore
    │   │   ├── digest/
    │   │   │   └── digestService.ts       ← daily briefing + scheduler
    │   │   ├── api/
    │   │   │   ├── feedController.ts
    │   │   │   └── routes.ts
    │   │   └── index.ts
    │   ├── sources.config.ts              ← user-defined source list
    │   └── package.json
    └── frontend/
        ├── src/
        │   ├── Feed/                      ← live scrollable feed + interaction controls
        │   ├── Digest/                    ← daily briefing view
        │   └── App.tsx
        └── package.json
```

---

## Sources Configuration

Sources are defined in `news-feed/backend/sources.config.ts` using a typed `defineSource()` helper:

```typescript
// Three source types supported:
defineSource({ id, type: 'rss',     label, url, lang? })
defineSource({ id, type: 'reddit',  label, subreddits, limit? })
defineSource({ id, type: 'rsshub', label, rsshubRoute })
```

**Initial sources:**

| ID            | Type    | Label              | Details                                          |
|---------------|---------|--------------------|--------------------------------------------------|
| geektime      | rss     | GeekTime           | `https://www.geektime.co.il/feed/` (lang: he)   |
| calcalist     | rss     | Calcalist Tech     | `https://www.calcalist.co.il/rss/` (lang: he)   |
| reddit-eng    | reddit  | r/engineering      | ExperiencedDevs, systems, devops, MachineLearning |
| tg-geektime   | rsshub  | GeekTime Telegram  | `/telegram/channel/geektime_il`                  |
| tiktok-tech   | rsshub  | TikTok Tech        | `/tiktok/tag/softwareengineering`                |

RSSHub is used via `rsshub.app` (public instance) — no self-hosting required.

---

## Curator Layer

**Claude persona prompt (core):**
> "You are a principal tech architect reviewing engineering news. For each article: summarise in 2–3 sentences, tag relevant themes, assess whether this is real signal or hype, and if actionable: recommend adopt/watch/avoid. Be opinionated and concise. Skip obvious content. Surface what a senior engineer designing distributed systems should actually care about."

**Enriched article schema:**

```typescript
interface EnrichedArticle {
  // from source
  id: string;
  title: string;
  url: string;
  source: string;         // e.g. 'geektime', 'reddit-eng'
  publishedAt: Date;
  rawContent: string;

  // added by curator
  summary: string;        // 2–3 sentence TL;DR
  themes: Theme[];        // infra | ai-ml | security | frontend | data | cloud | culture | tooling
  signal: 'real' | 'hype' | 'noise';
  action: 'adopt' | 'watch' | 'avoid' | null;
  insight: string;        // why this matters for architecture
  curatedAt: Date;
}
```

**Ingestion schedule:**

| Job          | Frequency       | What it does                                                        |
|--------------|-----------------|---------------------------------------------------------------------|
| Feed refresh | Every 30 min    | Fetch new articles → curate uncurated ones → store enriched result  |
| Daily digest | 07:00 daily     | Pick top 10 articles → Claude writes structured morning briefing    |
| Cleanup      | Weekly          | Delete articles older than 30 days                                  |

---

## Personalization Layer

### Interaction Tracking

Every article interaction is recorded as an event. Two types:

**Explicit** (user-triggered UI actions):
- `thumb_up` — user liked the article
- `thumb_down` — user disliked the article
- `skip` — user dismissed without reading
- `not_for_me` — stronger signal than skip; suppress similar articles

**Implicit** (behavioral, tracked client-side):
- `view` — user opened/expanded the article
- `dwell_ms` — milliseconds spent on the article (sent on close/blur)
- `click_from_digest` — opened from the digest view (higher intent signal than feed browsing)

```typescript
interface ArticleInteraction {
  id: string;
  articleId: string;
  type: 'thumb_up' | 'thumb_down' | 'skip' | 'not_for_me' | 'view' | 'dwell' | 'click_from_digest';
  value?: number;   // dwell_ms for 'dwell', otherwise null
  recordedAt: Date;
}
```

### Preference Agent

A Claude agent that runs **weekly** and **after each digest session**. It reads the last N interaction events and produces a `UserPreferenceProfile`:

```typescript
interface UserPreferenceProfile {
  themeWeights: Record<Theme, number>;    // e.g. { infra: 1.4, tooling: 0.6 }
  signalWeights: Record<Signal, number>;  // e.g. { real: 1.5, hype: 0.8, noise: 0.2 }
  actionWeights: Record<Action, number>;  // e.g. { adopt: 1.3, watch: 1.0, avoid: 0.7 }
  sourceWeights: Record<string, number>;  // e.g. { geektime: 1.2, 'reddit-eng': 1.0 }
  summary: string;   // natural-language description of learned patterns
  updatedAt: Date;
}
```

The agent prompt instructs Claude to:
- Infer weights from engagement patterns (high dwell + thumb_up = strong positive signal)
- Note topic fatigue (many skips on a theme → reduce weight)
- Write a concise `summary` describing observed preferences in plain English

The profile is stored as a single JSON row in the DB — human-readable and editable.

### Re-ranking

After curation, each article receives a `personalScore`:

```
personalScore = base_score
  × themeWeights[article.themes[0]]
  × signalWeights[article.signal]
  × actionWeights[article.action ?? 'watch']
  × sourceWeights[article.source]
```

`base_score` is 1.0 for new articles; adjusted by recency (articles older than 24h get a small decay).

Feed ordering and digest top-10 selection both use `personalScore`.

### Curator Injection

The preference profile's `summary` field is appended to the curator prompt:

> "…additionally, this user's reading patterns show: [summary]. Weight your signal and action recommendations accordingly."

This means Claude curates *with the user's interests in mind*, not just re-ranks afterwards.

### UI Controls

Each article card exposes interaction controls (visible on hover):
- `↑` thumb up / `↓` thumb down — explicit preference signal
- `✕` skip — dismiss from feed
- Dwell time tracked automatically when article is expanded

---

## Frontend

### Routes

| Route          | View                                                          |
|----------------|---------------------------------------------------------------|
| `/news`        | Live feed — filterable by theme, paginated, newest first      |
| `/news/digest` | Today's morning briefing — browse past digests by date        |
| `/`            | Redirects to `/canvas` (existing app)                         |

### Live Feed (`/news`)

- Theme filter chips at top: All / infra / ai-ml / security / ... (active chip highlighted indigo)
- Article cards with colored left-border by signal: indigo = real, amber = hype, red = noise
- Per card: theme badge + signal/action badge + source + age, title, 2-line summary, insight line
- Noise-rated articles shown at reduced opacity
- Infinite scroll / pagination

### Daily Digest (`/news/digest`)

- Header: "Morning Brief" + date + article count + "← Yesterday" nav
- **Architect's Take** block — Claude's editorial overview of the day's themes
- Numbered article list (green = adopt, amber = watch) with title, action, theme, source
- Clicking an article opens the full enriched card or navigates to source URL

---

## What Gets Ported from pocketknife

| Component       | From pocketknife                        | New / extended                        |
|-----------------|-----------------------------------------|---------------------------------------|
| redditFetcher   | Port `searchReddit()`                   | —                                     |
| rsshubFetcher   | Port `parseRssItems()` + RSSHub pattern | Add TikTok route                      |
| rssFetcher      | RSS parsing logic                       | Config-file source loading            |
| curatorService  | `claudeService` wrapper                 | Tech-architect persona prompt         |
| digestService   | `get-digest` action skeleton            | Briefing format + cron scheduler      |
| sources.config  | —                                       | New — typed source definitions        |
| Frontend        | —                                       | New — Feed + Digest UI (React + Vite) |

---

## Data Storage

SQLite (via Prisma) for simplicity — single-user, no concurrency concerns.

**Tables:**
- `Article` — raw + enriched fields + `personalScore`, unique on `url`
- `Digest` — date, briefingText, articleIds (JSON array)
- `ArticleInteraction` — one row per interaction event (explicit + implicit)
- `UserPreferenceProfile` — single row, JSON blob, updated by PreferenceAgent

---

## Out of Scope

- Multi-user / auth
- Push notifications
- Article bookmarking
- Telegram bot output (may be added later)
- Self-hosted RSSHub instance
