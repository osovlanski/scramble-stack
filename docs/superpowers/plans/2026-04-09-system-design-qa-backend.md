# App C — System Design Q&A: Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `apps/system-design-qa/backend` Express + Prisma service — question library, three session modes, Claude scoring, and a public Canvas diagram export endpoint.

**Architecture:** Express on port 3002, SQLite via Prisma, Claude for question generation + interview turns + scoring. Canvas backend called server-to-server for diagram context. Questions seeded on first startup.

**Tech Stack:** Node 20, TypeScript, Express, Prisma (SQLite), Vitest, `@anthropic-ai/sdk`, axios

**Reference:** Follow `apps/news-feed/backend/` patterns exactly for package.json, tsconfig, db.ts, claude.ts, and vitest.config.ts.

---

### Task 1: Backend package scaffold

**Files:**
- Create: `apps/system-design-qa/backend/package.json`
- Create: `apps/system-design-qa/backend/tsconfig.json`
- Create: `apps/system-design-qa/backend/vitest.config.ts`
- Create: `apps/system-design-qa/backend/railway.json`
- Create: `apps/system-design-qa/backend/.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "scramble-stack-system-design-qa-backend",
  "version": "1.0.0",
  "main": "src/index.ts",
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "prisma generate && tsc",
    "start": "node dist/apps/system-design-qa/backend/src/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@prisma/client": "^5.0.0",
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.2",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "../../..",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { globals: true } });
```

- [ ] **Step 4: Create railway.json**

```json
{
  "$schema": "https://schema.railway.app/railway-config.json",
  "build": { "builder": "NIXPACKS", "buildCommand": "npm run build" },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- [ ] **Step 5: Create .env.example**

```
ANTHROPIC_API_KEY=your-key-here
DATABASE_URL=file:./dev.db
PORT=3002
CANVAS_BACKEND_URL=http://localhost:3000
GRADED_TIMEOUT_MINUTES=45
```

- [ ] **Step 6: Install dependencies**

```bash
npm install --workspace=apps/system-design-qa/backend
```

Expected: `node_modules` populated, no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/system-design-qa/backend/package.json apps/system-design-qa/backend/tsconfig.json apps/system-design-qa/backend/vitest.config.ts apps/system-design-qa/backend/railway.json apps/system-design-qa/backend/.env.example
git commit -m "feat(system-design-qa): scaffold backend package"
```

---

### Task 2: Prisma schema + db.ts

**Files:**
- Create: `apps/system-design-qa/backend/prisma/schema.prisma`
- Create: `apps/system-design-qa/backend/src/db.ts`

- [ ] **Step 1: Create schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Question {
  id            String    @id @default(cuid())
  title         String
  company       String?
  genre         String
  difficulty    String
  description   String
  hints         String
  modelAnswer   String
  isAiGenerated Boolean   @default(false)
  createdAt     DateTime  @default(now())
  sessions      Session[]
}

model Session {
  id              String   @id @default(cuid())
  questionId      String
  question        Question @relation(fields: [questionId], references: [id])
  mode            String
  status          String   @default("in_progress")
  messages        String   @default("[]")
  textAnswer      String?
  canvasDiagramId String?
  score           Int?
  feedback        String?
  createdAt       DateTime @default(now())
}
```

- [ ] **Step 2: Create src/db.ts**

Identical pattern to `apps/news-feed/backend/src/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

- [ ] **Step 3: Push schema to DB**

```bash
cd apps/system-design-qa/backend && npx prisma db push
```

Expected: `SQLite database created`, two tables created.

- [ ] **Step 4: Commit**

```bash
git add apps/system-design-qa/backend/prisma apps/system-design-qa/backend/src/db.ts
git commit -m "feat(system-design-qa): add Prisma schema and db client"
```

---

### Task 3: Claude service wrapper

**Files:**
- Create: `apps/system-design-qa/backend/src/claude.ts`

- [ ] **Step 1: Create claude.ts**

Identical to `apps/news-feed/backend/src/claude.ts`. The only difference is `maxTokens` defaults to `2048` to keep scoring responses concise:

```typescript
import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  client = new Anthropic({ apiKey });
  return client;
}

export async function claudeChat(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 2048,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  });
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return block?.text ?? '';
}

export async function claudeConverse(params: {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages,
  });
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return block?.text ?? '';
}
```

Note: `claudeConverse` accepts a message array for interview back-and-forth. `claudeChat` is single-shot (used for scoring and question generation).

- [ ] **Step 2: Commit**

```bash
git add apps/system-design-qa/backend/src/claude.ts
git commit -m "feat(system-design-qa): add Claude service wrapper"
```

---

### Task 4: Question seed data

**Files:**
- Create: `apps/system-design-qa/backend/src/questions/questions.seed.ts`
- Create: `apps/system-design-qa/backend/src/questions/seeder.ts`

- [ ] **Step 1: Create questions.seed.ts**

```typescript
export interface SeedQuestion {
  title: string;
  company: string | null;
  genre: string;
  difficulty: string;
  description: string;
  hints: string[];
  modelAnswer: string;
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    title: "Design the Twitter feed",
    company: "Twitter",
    genre: "feed",
    difficulty: "hard",
    description: "Design a system that allows users to post tweets and see a personalized feed of tweets from people they follow. The system must support 300M daily active users, with reads heavily outnumbering writes.",
    hints: [
      "Consider fanout-on-write vs fanout-on-read for feed generation",
      "How do you handle celebrity accounts with millions of followers?",
      "What does the data model for tweets and follow relationships look like?",
      "How would you handle timeline cache invalidation?",
    ],
    modelAnswer: "Use a hybrid fanout approach: fanout-on-write for regular users (push tweets to follower timelines at write time), fanout-on-read for celebrities (pull on demand). Store timelines in Redis sorted sets (tweet IDs by timestamp). Tweets in Cassandra (wide-column, write-optimized). Follow graph in a graph DB or adjacency list in Redis. CDN for media. Load balancers → stateless app servers. Separate read/write paths. Timeline service, tweet service, user service as independent microservices. For 300M DAU: estimate ~100M feed reads/day → Redis cluster with ~1M timeline entries cached per shard.",
  },
  {
    title: "Design Uber's dispatch system",
    company: "Uber",
    genre: "distributed-systems",
    difficulty: "hard",
    description: "Design the backend system that matches riders with nearby drivers in real time. The system must handle 15M trips per day globally, with sub-second matching latency.",
    hints: [
      "How do you efficiently find nearby drivers without querying all drivers?",
      "What happens if the matching service goes down mid-ride?",
      "How do you handle surge pricing decisions?",
      "Consider geospatial indexing strategies.",
    ],
    modelAnswer: "Geospatial index using geohash or S2 cells — drivers report location every 4 seconds to a location service, stored in Redis geospatial index. Matching service queries drivers within expanding radius using GEORADIUS. WebSocket or long-polling for real-time driver updates to rider app. Ride state machine (requested → matching → accepted → in-progress → completed) persisted in Postgres with Redis cache. Kafka for async events (trip completion → billing → ratings). Separate supply/demand forecasting service for surge. Distributed lock (Redis) on driver assignment to prevent double-booking. Fallback: if matching service fails, client retries with exponential backoff.",
  },
  {
    title: "Design Netflix's CDN",
    company: "Netflix",
    genre: "cdn",
    difficulty: "hard",
    description: "Design the content delivery system that streams video to 200M subscribers globally with minimal buffering. Netflix accounts for ~15% of global internet traffic.",
    hints: [
      "How do you decide which content to pre-position at which edge nodes?",
      "What encoding formats and bitrates do you store?",
      "How does the client adapt to changing network conditions?",
      "How do you handle a new popular show that everyone watches at once?",
    ],
    modelAnswer: "Open Connect CDN: Netflix-operated servers at ISP data centers. Pre-position popular content using ML predictions (top 1000 titles cover ~80% of streams). Store multiple encodings (H.264/H.265/AV1) at 7 bitrates (0.5Mbps → 20Mbps). Client uses ABR (adaptive bitrate) — downloads 2-4 second chunks, switches quality based on buffer health and bandwidth estimate. Manifest file served from AWS; actual chunks from nearest Open Connect appliance. For new popular shows: replicate to all edge nodes before launch. CDN miss → origin in AWS S3. ISP peering reduces transit cost. Separate metadata service (title, thumbnails) from video delivery path.",
  },
  {
    title: "Design WhatsApp messaging",
    company: "WhatsApp",
    genre: "messaging",
    difficulty: "medium",
    description: "Design a messaging system that supports 1:1 and group chats, delivery receipts, and end-to-end encryption for 2B users. Messages must be delivered even when recipients are offline.",
    hints: [
      "How do you handle message delivery when the recipient is offline?",
      "What is the data model for group chats with up to 1024 members?",
      "How do delivery receipts (sent/delivered/read) work at scale?",
      "Where do you store message history?",
    ],
    modelAnswer: "Persistent WebSocket connections from clients to chat servers. Message queue (Kafka) for reliable delivery — messages persisted until ACKed. When recipient offline: store in DB, push notification via APNS/FCM, deliver on reconnect. Message store: Cassandra with (chat_id, timestamp) partition key for efficient range queries. E2E encryption: Signal Protocol — keys never on server. Group messages: fan out to each member's queue. Delivery receipts: client sends ACK → server updates status → notifies sender. Media stored in distributed blob store (separate from message store). Chat servers stateless behind load balancer; consistent hashing for WebSocket routing.",
  },
  {
    title: "Design Amazon's product search",
    company: "Amazon",
    genre: "search",
    difficulty: "medium",
    description: "Design a product search system that handles 500M product catalog entries and serves 1B search queries per day with sub-100ms latency. Results must be ranked by relevance and personalized.",
    hints: [
      "How do you index 500M products for full-text search?",
      "What signals go into ranking: relevance, sales, reviews, personalization?",
      "How do you handle search suggestions and spell correction?",
      "How do you update the index when product data changes?",
    ],
    modelAnswer: "Elasticsearch cluster for full-text search — inverted index on title, description, category. Separate ranking service: base score (BM25 relevance) × sales velocity × review score × personalization multiplier. Personalization: user's purchase/click history → feature vector → dot product with item embeddings (ANN index, e.g. FAISS). Query pipeline: spell check (edit distance) → query expansion (synonyms) → retrieval → rerank → filter by availability/price. Index updates: product change events → Kafka → index worker → Elasticsearch. Search suggestions: trie or prefix index in Redis. A/B test ranking changes continuously. Cache popular queries (Redis, TTL 5min).",
  },
  {
    title: "Design Google Docs collaborative editing",
    company: "Google",
    genre: "storage",
    difficulty: "hard",
    description: "Design a real-time collaborative document editor where multiple users can edit the same document simultaneously and see each other's changes instantly.",
    hints: [
      "How do you handle two users editing the same character position simultaneously?",
      "How do you sync state when a user reconnects after being offline?",
      "What is the data model for document content and edit history?",
      "How do you scale to millions of concurrent documents?",
    ],
    modelAnswer: "Operational Transformation (OT) or CRDT for conflict resolution — OT is simpler for server-mediated systems. Each operation (insert/delete at position) transformed against concurrent ops before applying. Server as source of truth: client sends op → server transforms against pending ops → broadcasts transformed op to all collaborators. Document stored as op log (append-only) + periodic snapshots in Bigtable. Presence (cursor positions) via separate lightweight pub/sub (Redis). WebSocket per document session; stateful collaboration server per active document. On reconnect: client sends last known revision → server replays missing ops. Separate read path (view document) from edit path. Autosave every 30s to prevent data loss.",
  },
  {
    title: "Design Airbnb's booking system",
    company: "Airbnb",
    genre: "payments",
    difficulty: "medium",
    description: "Design a booking platform that allows hosts to list properties and guests to search, book, and pay. The system must prevent double-bookings and handle payment processing reliably.",
    hints: [
      "How do you prevent two guests from booking the same property on the same night?",
      "How do you handle partial payment failures?",
      "What is the data model for availability calendars?",
      "How do you handle the search for available properties by date range?",
    ],
    modelAnswer: "Availability stored as date-range records per listing (not one record per day). Search uses availability index (Elasticsearch with date range filter). Booking flow: optimistic lock — reserve availability (status: HOLD with TTL 10min) → process payment → confirm booking atomically. Two-phase: if payment fails, release hold. Idempotency keys on payment API to prevent duplicate charges. Postgres for bookings/payments (ACID). Availability calendar: cache in Redis, invalidated on booking. Host payout via background job after check-in + grace period. Cancellation policy applied at booking service layer. Separate listing service, booking service, payment service — saga pattern for cross-service consistency.",
  },
  {
    title: "Design LinkedIn's news feed",
    company: "LinkedIn",
    genre: "feed",
    difficulty: "medium",
    description: "Design a professional news feed that shows posts from a user's connections and followed companies. Feed must be relevant, real-time, and personalized for 800M users.",
    hints: [
      "How is the LinkedIn feed different from Twitter's in terms of graph structure?",
      "How do you balance recency vs. relevance in ranking?",
      "How do you handle viral content that suddenly gets many engagements?",
    ],
    modelAnswer: "Push-pull hybrid similar to Twitter but with connection graph instead of follow graph. Connection degree matters (1st degree > 2nd degree). Feed generation: fanout-on-write for regular users, fanout-on-read for viral posts. Ranking model: engagement score × recency decay × connection strength × content type preference (ML model). Feed stored in Redis per user. Post engagement (likes, comments, shares) updates ranking score asynchronously via Kafka. Viral detection: if post engagement rate exceeds threshold, switch to pull-based for that post. Notification service for real-time feed updates. Separate professional content signals: job changes, endorsements, articles weighted higher.",
  },
  {
    title: "Design Dropbox file sync",
    company: "Dropbox",
    genre: "storage",
    difficulty: "medium",
    description: "Design a file synchronization service that keeps files in sync across multiple devices for 700M users. Files range from 1KB to 50GB.",
    hints: [
      "How do you efficiently sync only the changed parts of a file?",
      "How do you handle conflicts when the same file is edited on two devices simultaneously?",
      "Where do you store file metadata vs. file content?",
      "How do you handle large file uploads reliably?",
    ],
    modelAnswer: "Split files into 4MB chunks, hash each chunk (SHA-256). On sync: compare chunk hashes, upload only changed chunks (delta sync). Metadata (file path, chunk list, version) in Postgres. Chunks in S3 (content-addressed by hash — deduplication is free). Upload: multipart upload directly to S3 via presigned URLs. Client syncs via long-polling or WebSocket to notification service. Conflict: both versions kept, user prompted to resolve. Version history: immutable chunk store + metadata snapshots. Large file handling: chunked upload with resumable sessions. Bandwidth optimization: compress before upload, LAN sync (detect peers on same network).",
  },
  {
    title: "Design Slack real-time messaging",
    company: "Slack",
    genre: "messaging",
    difficulty: "hard",
    description: "Design a team messaging platform with channels, direct messages, search, and real-time notifications for 20M daily active users across thousands of workspaces.",
    hints: [
      "How do you isolate data between different company workspaces?",
      "How does channel message search work at scale?",
      "How do you deliver real-time messages to users who may be on web, desktop, and mobile?",
    ],
    modelAnswer: "Workspace-level data isolation — each workspace can be sharded independently. Messages stored in Cassandra (workspace_id, channel_id, timestamp). Full-text search via Elasticsearch per workspace index. Real-time delivery: WebSocket gateway (stateful) → client. When user sends message: API server → Kafka → fanout service → pushes to all channel members' WebSocket connections. Members not connected: push notification. Presence service: Redis tracking connected users per workspace. Read state tracking: last-read timestamp per user per channel in Redis. App unfurling (link previews) as async job. Audit logs for enterprise customers. Rate limiting per workspace to prevent noisy neighbors.",
  },
  {
    title: "Design YouTube's video upload pipeline",
    company: "YouTube",
    genre: "cdn",
    difficulty: "hard",
    description: "Design the backend pipeline that processes uploaded videos — transcoding, thumbnail generation, and delivery — at a scale of 500 hours of video uploaded per minute.",
    hints: [
      "How do you transcode a 2GB video into multiple resolutions/formats without blocking the uploader?",
      "How do you generate thumbnails at scale?",
      "How do you handle a video that fails transcoding midway?",
    ],
    modelAnswer: "Upload: client chunks video → API server → raw blob to GCS (Google Cloud Storage). Upload complete → publish job to Kafka. Transcoding workers: pool of GPU/CPU workers pull from Kafka, transcode to 360p/480p/720p/1080p/4K using FFmpeg. Store each resolution in GCS. Thumbnail: extract frames at 10% intervals, store in GCS. Failure handling: checkpointing — if transcoder crashes, job requeued from last checkpoint. Idempotent worker design. CDN: YouTube's own CDN (edge caches), popular videos pre-cached globally. Metadata (title, description, tags) in Spanner. Video analytics in BigQuery. For 500 hours/min: ~30,000 parallel transcoding tasks, autoscaling worker fleet.",
  },
  {
    title: "Design Instagram's photo storage",
    company: "Instagram",
    genre: "storage",
    difficulty: "medium",
    description: "Design the photo/video storage and delivery system for Instagram. Users upload 100M photos per day. Each photo must be served in multiple resolutions.",
    hints: [
      "How do you store photos at different resolutions without storing full duplicates?",
      "How do you route users to the nearest copy of a photo?",
      "How do you handle the thundering herd when a celebrity posts?",
    ],
    modelAnswer: "Upload: presigned S3 URL → direct client-to-S3 upload (bypasses app servers). On upload complete: Lambda trigger → resize worker generates 4 sizes (thumbnail 150px, small 320px, medium 640px, original). Store all sizes in S3 under consistent key scheme. CDN (CloudFront) in front of S3 — cache popular photos at edge. Cache-Control headers set to 1 year (photos are immutable). Celebrity post thundering herd: CDN handles naturally with cache warming. Photo metadata (owner, caption, tags, location) in Postgres sharded by user_id. Explore/hashtag search: Elasticsearch. Story content (24h expiry): TTL set on S3 objects + DynamoDB metadata with TTL.",
  },
  {
    title: "Design a payment processing system",
    company: "Stripe",
    genre: "payments",
    difficulty: "hard",
    description: "Design a payment processing platform that handles credit card charges, refunds, and payouts for millions of merchants. The system must be highly reliable, idempotent, and PCI-compliant.",
    hints: [
      "How do you prevent a charge from being processed twice if the client retries?",
      "How do you handle partial failures in a charge→capture→settle flow?",
      "How do you store card data without violating PCI compliance?",
      "What does the data model for payments, refunds, and disputes look like?",
    ],
    modelAnswer: "Idempotency keys: client provides unique key per request → server stores key+result → on retry, return cached result instead of re-processing. Charge flow (3-phase): authorize → capture → settle. Each phase is a separate DB record with status. Saga pattern for compensation on failure. Card data: tokenize at entry point (Stripe.js), raw PANs never touch application servers — stored in separate PCI-scoped vault. Ledger: double-entry accounting in Postgres (every debit has matching credit). Webhook delivery: async, retry with exponential backoff, idempotent handlers. Fraud detection: ML model scores each transaction before authorization. Reconciliation job nightly against card network settlement files.",
  },
  {
    title: "Design Discord's voice channels",
    company: "Discord",
    genre: "distributed-systems",
    difficulty: "hard",
    description: "Design the real-time voice communication system that allows thousands of users to join voice channels simultaneously with low latency audio.",
    hints: [
      "What protocol is best suited for real-time audio? Why not HTTP?",
      "How do you minimize audio latency across geographic regions?",
      "How do you handle users joining/leaving mid-conversation?",
      "What happens when a voice server crashes?",
    ],
    modelAnswer: "WebRTC for client-to-server audio (UDP-based, handles packet loss gracefully). Voice servers (media servers) in each region receive all audio streams, mix, and rebroadcast to all participants. Client connects to nearest voice server via routing service (anycast + latency probe). Selective forwarding unit (SFU) architecture — server doesn't decode/re-encode, just forwards RTP packets to reduce CPU. Signaling via WebSocket (join/leave/mute events). On voice server crash: clients detect via WebSocket disconnect → reconnect to next available server within 2-3 seconds. Capacity: each voice server handles ~1000 concurrent users. Auto-scaling based on active channel count. Jitter buffer on client side for smooth playback.",
  },
  {
    title: "Design TikTok's recommendation engine",
    company: "TikTok",
    genre: "feed",
    difficulty: "hard",
    description: "Design the For You Page recommendation system that serves hyper-personalized short video feeds to 1B users, making TikTok one of the most engaging apps in history.",
    hints: [
      "What signals does TikTok use beyond explicit likes and follows?",
      "How do you bootstrap recommendations for a new user with no history?",
      "How do you balance exploration (new content) vs. exploitation (known preferences)?",
      "How do you handle content moderation at this scale?",
    ],
    modelAnswer: "Two-stage retrieval + ranking. Retrieval: candidate generation from collaborative filtering (users similar to you liked X), content-based filtering (videos similar to ones you've watched), trending pool. Ranking: deep learning model with features: watch time %, replay count, share, comment, sound on, account age, device. Implicit signals weighted heavily — 3 seconds watched > explicit like. Cold start: new users shown trending + geo-popular content, rapidly personalizes after 5-10 interactions. New content: every video gets exposure to a small test audience; performance metrics determine broader distribution (viral loop). Real-time feature store (Redis) for freshness. Batch model training nightly, online learning for trending signals. A/B test ranking changes on 1% traffic before rollout.",
  },
  {
    title: "Design a URL shortener",
    company: null,
    genre: "distributed-systems",
    difficulty: "easy",
    description: "Design a URL shortening service like bit.ly. Users submit a long URL and get a short 7-character code. Redirects must be fast (<10ms). System handles 100M URLs and 10B redirects/month.",
    hints: [
      "How do you generate unique short codes at scale without collisions?",
      "Where is the bottleneck — reads or writes?",
      "How do you make redirects as fast as possible?",
    ],
    modelAnswer: "Encode a base-62 counter (a-z, A-Z, 0-9) for 7 characters → 62^7 ≈ 3.5T unique URLs. Counter maintained in Redis (INCR) or distributed ID generator (Snowflake). Short code → long URL mapping in Cassandra (key-value, read-optimized). Redirect: DNS → load balancer → app server → Redis cache lookup → 301/302 redirect. Cache popular URLs in Redis (LRU, TTL 24h) — 80% of traffic served from cache. Write path: generate code → write to Cassandra → cache. Custom aliases: check availability → store with custom key. Analytics: click events to Kafka → Flink aggregation → analytics DB. CDN at DNS level can cache popular redirects further.",
  },
  {
    title: "Design a rate limiter",
    company: null,
    genre: "distributed-systems",
    difficulty: "easy",
    description: "Design a rate limiting service that restricts clients to N requests per time window. It must work across multiple API server instances with sub-millisecond overhead per request.",
    hints: [
      "How do you implement rate limiting across multiple servers sharing no memory?",
      "What algorithm do you use — fixed window, sliding window, or token bucket?",
      "How do you handle race conditions when multiple requests arrive simultaneously?",
    ],
    modelAnswer: "Redis-based token bucket or sliding window counter. Token bucket: each client key has a counter and last-refill timestamp in Redis. Use Lua script (atomic) to check + decrement in one operation — prevents race conditions. Sliding window log: store each request timestamp in Redis sorted set (ZSET), trim entries older than window on each request, check count. Fixed window: INCR + EXPIRE — simpler but allows 2× burst at window boundaries. Middleware on API gateway (not app servers) to avoid N round-trips. Redis cluster for HA. Rate limit headers returned: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Different limits per endpoint, per user tier (free vs. paid). Distributed: all app servers hit same Redis → consistent limits.",
  },
  {
    title: "Design a distributed cache",
    company: null,
    genre: "distributed-systems",
    difficulty: "medium",
    description: "Design a distributed in-memory cache system like Redis or Memcached. The cache must support GET/SET/DELETE, handle node failures, and scale horizontally to petabytes of data.",
    hints: [
      "How do you distribute keys across multiple cache nodes?",
      "What happens when a cache node goes down?",
      "How do you handle cache invalidation when the underlying data changes?",
      "How do you prevent cache stampede (thundering herd on cache miss)?",
    ],
    modelAnswer: "Consistent hashing ring to distribute keys across nodes — each node owns a range of the ring. Virtual nodes (vNodes) per physical server for even distribution. On node failure: successor node takes over that range (replication to next N nodes for redundancy). Client library handles routing (knows ring topology via gossip protocol). Cache invalidation strategies: TTL (simple, eventual consistency), write-through (update cache on write), write-behind (async). Cache stampede prevention: mutex lock on first miss (one request populates, others wait), or probabilistic early expiration. Eviction policies: LRU for general use, LFU for skewed access patterns. Replication: primary-replica per shard for read scaling. Persistence: periodic snapshots + AOF log for recovery.",
  },
  {
    title: "Design a push notification system",
    company: null,
    genre: "notifications",
    difficulty: "medium",
    description: "Design a push notification system that delivers notifications to iOS and Android devices for a social platform with 500M users. Notifications must be delivered within 5 seconds of the triggering event.",
    hints: [
      "How do you route a notification to the correct device when a user has multiple devices?",
      "How do you handle APNs/FCM rate limits and failures?",
      "How do you avoid sending notifications to users who have disabled them?",
    ],
    modelAnswer: "Device token registry: user_id → [device_token, platform (iOS/Android), enabled] in Cassandra. Notification service consumes events from Kafka (new message, like, follow). Per notification: look up recipient's devices → check preferences → batch by platform → send to APNs (iOS) or FCM (Android). APNs/FCM handle last-mile delivery. Rate limiting: respect platform limits, queue excess with priority. Delivery tracking: APNs/FCM feedback service reports unregistered tokens → clean up registry. User preferences stored in Redis (fast read). Notification aggregation: if 50 likes in 10 min → send one 'and 49 others liked your post'. Failed delivery (device offline): platform stores and delivers when device reconnects (up to 28 days for FCM). Dead letter queue for permanent failures.",
  },
  {
    title: "Design a leaderboard",
    company: null,
    genre: "storage",
    difficulty: "easy",
    description: "Design a real-time leaderboard for a mobile game with 10M active players. The leaderboard shows the top 100 players and a player's own rank. Scores update in real time.",
    hints: [
      "How do you efficiently find a player's rank among 10M players?",
      "How do you handle score updates without recomputing the entire ranking?",
      "What data structure is ideal for sorted rankings with fast updates?",
    ],
    modelAnswer: "Redis sorted set (ZSET) — O(log N) insertion/update, O(log N) rank lookup. ZADD updates score, ZREVRANK returns player's position, ZREVRANGE returns top N. For 10M players, Redis ZSET handles this easily (each entry ~100 bytes → ~1GB total). Score update: ZADD leaderboard <score> <player_id>. Top 100: ZREVRANGE leaderboard 0 99 WITHSCORES. Player rank: ZREVRANK leaderboard <player_id>. Persistence: Postgres as source of truth, Redis as read-through cache. Batch sync Postgres → Redis on startup. Weekly/monthly leaderboards: separate ZSET per time window, expire with TTL. Regional leaderboards: separate ZSET per region. Anti-cheat: validate score updates server-side before accepting.",
  },
];
```

- [ ] **Step 2: Create src/questions/seeder.ts**

```typescript
import { prisma } from '../db';
import { SEED_QUESTIONS } from './questions.seed';

export async function seedQuestionsIfEmpty(): Promise<void> {
  const count = await prisma.question.count();
  if (count > 0) return;

  for (const q of SEED_QUESTIONS) {
    await prisma.question.create({
      data: {
        title: q.title,
        company: q.company,
        genre: q.genre,
        difficulty: q.difficulty,
        description: q.description,
        hints: JSON.stringify(q.hints),
        modelAnswer: q.modelAnswer,
        isAiGenerated: false,
      },
    });
  }

  console.log(`[seeder] seeded ${SEED_QUESTIONS.length} questions`);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/system-design-qa/backend/src/questions/
git commit -m "feat(system-design-qa): add question seed data and seeder"
```

---

### Task 5: Question repository + controller

**Files:**
- Create: `apps/system-design-qa/backend/src/questions/questionController.ts`
- Create: `apps/system-design-qa/backend/src/questions/questionController.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/questions/questionController.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../db', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { getQuestions, getQuestion } from './questionController';
import { prisma } from '../db';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const mockQuestion = {
  id: 'q1',
  title: 'Design Twitter',
  company: 'Twitter',
  genre: 'feed',
  difficulty: 'hard',
  description: 'Design Twitter feed',
  hints: '["hint1"]',
  modelAnswer: 'model answer',
  isAiGenerated: false,
  createdAt: new Date(),
};

describe('getQuestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns questions with parsed hints', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([mockQuestion] as any);
    vi.mocked(prisma.question.count).mockResolvedValue(1);
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    await getQuestions(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ questions: expect.any(Array), total: 1 })
    );
    const { questions } = (res.json as any).mock.calls[0][0];
    expect(questions[0].hints).toEqual(['hint1']);
  });

  it('filters by company', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    vi.mocked(prisma.question.count).mockResolvedValue(0);
    const req = { query: { company: 'Uber' } } as unknown as Request;
    await getQuestions(req, mockRes());
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ company: 'Uber' }) })
    );
  });

  it('does not expose modelAnswer in list', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([mockQuestion] as any);
    vi.mocked(prisma.question.count).mockResolvedValue(1);
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    await getQuestions(req, res);
    const { questions } = (res.json as any).mock.calls[0][0];
    expect(questions[0].modelAnswer).toBeUndefined();
  });
});

describe('getQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when not found', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(null);
    const req = { params: { id: 'missing' } } as unknown as Request;
    const res = mockRes();
    await getQuestion(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns question without modelAnswer', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
    const req = { params: { id: 'q1' } } as unknown as Request;
    const res = mockRes();
    await getQuestion(req, res);
    const result = (res.json as any).mock.calls[0][0];
    expect(result.modelAnswer).toBeUndefined();
    expect(result.hints).toEqual(['hint1']);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test --workspace=apps/system-design-qa/backend
```

Expected: FAIL — `getQuestions is not a function`

- [ ] **Step 3: Implement questionController.ts**

```typescript
// src/questions/questionController.ts
import type { Request, Response } from 'express';
import { prisma } from '../db';

function parseQuestion(q: any) {
  const { modelAnswer: _omit, ...rest } = q;
  return { ...rest, hints: JSON.parse(q.hints || '[]') };
}

export async function getQuestions(req: Request, res: Response): Promise<void> {
  const { company, genre, difficulty, q } = req.query as Record<string, string | undefined>;

  const where: any = {};
  if (company) where.company = company;
  if (genre) where.genre = genre;
  if (difficulty) where.difficulty = difficulty;
  if (q) where.title = { contains: q };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.question.count({ where }),
  ]);

  res.json({ questions: questions.map(parseQuestion), total });
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  res.json(parseQuestion(question));
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test --workspace=apps/system-design-qa/backend
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/questions/questionController.ts apps/system-design-qa/backend/src/questions/questionController.test.ts
git commit -m "feat(system-design-qa): add question controller with search/filter"
```

---

### Task 6: Question generator

**Files:**
- Create: `apps/system-design-qa/backend/src/questions/questionGenerator.ts`
- Create: `apps/system-design-qa/backend/src/questions/questionGenerator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/questions/questionGenerator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue(JSON.stringify({
    title: 'Design Uber dispatch',
    description: 'Design a dispatch system...',
    hints: ['Consider geohash', 'Think about matching latency'],
    modelAnswer: 'Use geospatial index...',
  })),
}));

vi.mock('../db', () => ({
  prisma: { question: { create: vi.fn().mockResolvedValue({ id: 'gen1' }) } },
}));

import { generateQuestion } from './questionGenerator';
import { claudeChat } from '../claude';
import { prisma } from '../db';

describe('generateQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls Claude and saves the generated question', async () => {
    const result = await generateQuestion({ genre: 'distributed-systems', difficulty: 'hard' });
    expect(claudeChat).toHaveBeenCalledOnce();
    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isAiGenerated: true, genre: 'distributed-systems' }),
      })
    );
    expect(result.id).toBe('gen1');
  });

  it('returns 400 if Claude response is not valid JSON', async () => {
    vi.mocked(claudeChat).mockResolvedValueOnce('not json');
    await expect(generateQuestion({ genre: 'feed', difficulty: 'medium' })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test --workspace=apps/system-design-qa/backend
```

- [ ] **Step 3: Implement questionGenerator.ts**

```typescript
// src/questions/questionGenerator.ts
import { claudeChat } from '../claude';
import { prisma } from '../db';

const SYSTEM = `You are a system design interviewer. Generate a system design interview question as JSON with these exact fields:
{
  "title": "Design X",
  "description": "2-3 sentence scenario with scale requirements",
  "hints": ["hint1", "hint2", "hint3", "hint4"],
  "modelAnswer": "A thorough model answer covering components, data model, scalability, and tradeoffs"
}
Return only valid JSON, no markdown.`;

export async function generateQuestion(params: {
  company?: string;
  genre: string;
  difficulty: string;
}): Promise<{ id: string }> {
  const context = [
    params.company ? `Company: ${params.company}` : '',
    `Genre: ${params.genre}`,
    `Difficulty: ${params.difficulty}`,
  ].filter(Boolean).join(', ');

  const raw = await claudeChat({
    system: SYSTEM,
    userMessage: `Generate a system design question. ${context}`,
    maxTokens: 2048,
  });

  let parsed: { title: string; description: string; hints: string[]; modelAnswer: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse question from Claude response');
  }

  if (!parsed.title || !parsed.description || !Array.isArray(parsed.hints) || !parsed.modelAnswer) {
    throw new Error('Claude response missing required fields');
  }

  const question = await prisma.question.create({
    data: {
      title: parsed.title,
      company: params.company ?? null,
      genre: params.genre,
      difficulty: params.difficulty,
      description: parsed.description,
      hints: JSON.stringify(parsed.hints),
      modelAnswer: parsed.modelAnswer,
      isAiGenerated: true,
    },
  });

  return { id: question.id };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test --workspace=apps/system-design-qa/backend
```

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/questions/questionGenerator.ts apps/system-design-qa/backend/src/questions/questionGenerator.test.ts
git commit -m "feat(system-design-qa): add AI question generator"
```

---

### Task 7: Interview service

**Files:**
- Create: `apps/system-design-qa/backend/src/sessions/interviewService.ts`
- Create: `apps/system-design-qa/backend/src/sessions/interviewService.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/sessions/interviewService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../claude', () => ({
  claudeConverse: vi.fn().mockResolvedValue('What is the expected read/write ratio?'),
}));

import { getOpeningQuestion, continueInterview, InterviewMessage } from './interviewService';
import { claudeConverse } from '../claude';

const mockQuestion = {
  title: 'Design Twitter',
  description: 'Design Twitter feed for 300M users.',
  hints: '["Consider fanout"]',
};

describe('getOpeningQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls claudeConverse with empty history and returns response', async () => {
    const result = await getOpeningQuestion(mockQuestion as any);
    expect(claudeConverse).toHaveBeenCalledOnce();
    expect(result).toBe('What is the expected read/write ratio?');
  });
});

describe('continueInterview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns readyToSubmit=false for fewer than 3 user turns', async () => {
    const messages: InterviewMessage[] = [
      { role: 'assistant', content: 'What is the scale?' },
      { role: 'user', content: '300M users' },
    ];
    const result = await continueInterview(mockQuestion as any, messages);
    expect(result.readyToSubmit).toBe(false);
  });

  it('returns readyToSubmit=true after 3 user turns', async () => {
    vi.mocked(claudeConverse).mockResolvedValueOnce('Great, go ahead and design the system.');
    const messages: InterviewMessage[] = [
      { role: 'assistant', content: 'Q1?' },
      { role: 'user', content: 'A1' },
      { role: 'assistant', content: 'Q2?' },
      { role: 'user', content: 'A2' },
      { role: 'assistant', content: 'Q3?' },
      { role: 'user', content: 'A3' },
    ];
    const result = await continueInterview(mockQuestion as any, messages);
    expect(result.readyToSubmit).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement interviewService.ts**

```typescript
// src/sessions/interviewService.ts
import { claudeConverse } from '../claude';
import type { Question } from '@prisma/client';

export interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

const INTERVIEW_SYSTEM = `You are a system design interviewer conducting a technical interview. 
Ask ONE focused clarifying question at a time about scale, constraints, or requirements.
After the candidate has answered 3 questions, respond with:
"Great, I have enough context. Go ahead and design the system — walk me through your architecture."
Keep responses concise (1-3 sentences).`;

export async function getOpeningQuestion(question: Question): Promise<string> {
  return claudeConverse({
    system: INTERVIEW_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `The candidate is answering this question: "${question.title}"\n\n${question.description}\n\nAsk your first clarifying question.`,
      },
    ],
  });
}

export async function continueInterview(
  question: Question,
  messages: InterviewMessage[]
): Promise<{ content: string; readyToSubmit: boolean }> {
  const userTurnCount = messages.filter(m => m.role === 'user').length;
  const isLastClarification = userTurnCount >= 3;

  const prompt = isLastClarification
    ? 'The candidate has answered enough questions. Tell them to go ahead and design the system now.'
    : 'Continue the interview with another clarifying question.';

  const conversationHistory = [
    {
      role: 'user' as const,
      content: `Question: "${question.title}"\n\n${question.description}\n\nBegin the interview.`,
    },
    ...messages,
    { role: 'user' as const, content: prompt },
  ];

  const content = await claudeConverse({
    system: INTERVIEW_SYSTEM,
    messages: conversationHistory,
  });

  return { content, readyToSubmit: isLastClarification };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/sessions/interviewService.ts apps/system-design-qa/backend/src/sessions/interviewService.test.ts
git commit -m "feat(system-design-qa): add interview service"
```

---

### Task 8: Canvas diagram fetcher

**Files:**
- Create: `apps/system-design-qa/backend/src/sessions/diagramFetcher.ts`
- Create: `apps/system-design-qa/backend/src/sessions/diagramFetcher.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/sessions/diagramFetcher.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');

import { fetchDiagram, DiagramExport } from './diagramFetcher';
import axios from 'axios';

describe('fetchDiagram', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns diagram export on success', async () => {
    const mockData: DiagramExport = {
      name: 'Twitter Design',
      nodes: [{ id: 'n1', type: 'service', data: { label: 'Tweet Service' } }],
      edges: [{ source: 'n1', target: 'n2' }],
    };
    vi.mocked(axios.get).mockResolvedValue({ data: mockData });
    const result = await fetchDiagram('diag-1');
    expect(result).toEqual(mockData);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/diagrams/diag-1/export'),
      expect.any(Object)
    );
  });

  it('returns null when diagram not found', async () => {
    vi.mocked(axios.get).mockRejectedValue({ response: { status: 404 } });
    const result = await fetchDiagram('missing');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement diagramFetcher.ts**

```typescript
// src/sessions/diagramFetcher.ts
import axios from 'axios';

export interface DiagramExport {
  name: string;
  nodes: { id: string; type: string; data: Record<string, unknown> }[];
  edges: { source: string; target: string; label?: string }[];
}

export async function fetchDiagram(diagramId: string): Promise<DiagramExport | null> {
  const baseUrl = process.env.CANVAS_BACKEND_URL ?? 'http://localhost:3000';
  try {
    const { data } = await axios.get<DiagramExport>(
      `${baseUrl}/api/diagrams/${diagramId}/export`,
      { timeout: 5000 }
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.error('[diagramFetcher] failed to fetch diagram:', err?.message);
    return null;
  }
}

export function diagramToText(diagram: DiagramExport): string {
  const nodeList = diagram.nodes
    .map(n => `- ${n.type} node: "${(n.data.label as string) || n.id}"`)
    .join('\n');
  const edgeList = diagram.edges
    .map(e => `- ${e.source} → ${e.target}${e.label ? ` (${e.label})` : ''}`)
    .join('\n');
  return `Diagram: "${diagram.name}"\nComponents:\n${nodeList}\nConnections:\n${edgeList}`;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/sessions/diagramFetcher.ts apps/system-design-qa/backend/src/sessions/diagramFetcher.test.ts
git commit -m "feat(system-design-qa): add Canvas diagram fetcher"
```

---

### Task 9: Scoring service

**Files:**
- Create: `apps/system-design-qa/backend/src/sessions/scoringService.ts`
- Create: `apps/system-design-qa/backend/src/sessions/scoringService.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/sessions/scoringService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue(JSON.stringify({
    breakdown: { scalability: 16, data_model: 14, component_design: 15, reliability: 13, tradeoffs: 14 },
    strengths: 'Good scalability approach',
    gaps: 'Missing fault tolerance details',
  })),
}));

import { scoreSubmission, ScoreResult } from './scoringService';
import { claudeChat } from '../claude';

const mockQuestion = {
  title: 'Design Twitter',
  description: 'Design Twitter feed',
  modelAnswer: 'Use fanout on write...',
};

describe('scoreSubmission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns total score as sum of breakdown', async () => {
    const result = await scoreSubmission({
      question: mockQuestion as any,
      textAnswer: 'My answer...',
    });
    expect(result.score).toBe(72);
    expect(result.breakdown.scalability).toBe(16);
    expect(result.strengths).toBe('Good scalability approach');
  });

  it('includes diagram text in prompt when provided', async () => {
    await scoreSubmission({
      question: mockQuestion as any,
      textAnswer: 'My answer',
      diagramText: 'Components: Tweet Service → DB',
    });
    const call = vi.mocked(claudeChat).mock.calls[0][0];
    expect(call.userMessage).toContain('Components: Tweet Service → DB');
  });

  it('throws when Claude response is invalid JSON', async () => {
    vi.mocked(claudeChat).mockResolvedValueOnce('not json');
    await expect(
      scoreSubmission({ question: mockQuestion as any, textAnswer: 'answer' })
    ).rejects.toThrow('Failed to parse score');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement scoringService.ts**

```typescript
// src/sessions/scoringService.ts
import { claudeChat } from '../claude';
import type { Question } from '@prisma/client';

export interface ScoreResult {
  score: number;
  breakdown: {
    scalability: number;
    data_model: number;
    component_design: number;
    reliability: number;
    tradeoffs: number;
  };
  strengths: string;
  gaps: string;
}

const SCORING_SYSTEM = `You are an expert system design interviewer. Score the candidate's answer.
Return ONLY valid JSON (no markdown) in this exact shape:
{
  "breakdown": {
    "scalability": <0-20>,
    "data_model": <0-20>,
    "component_design": <0-20>,
    "reliability": <0-20>,
    "tradeoffs": <0-20>
  },
  "strengths": "<what the candidate covered well>",
  "gaps": "<what was missing or incorrect>"
}

Scoring rubric:
- scalability (0-20): load handling, horizontal scaling, bottleneck identification
- data_model (0-20): schema design, storage choices, indexing strategy  
- component_design (0-20): service decomposition, API design, separation of concerns
- reliability (0-20): fault tolerance, retries, failure mode handling
- tradeoffs (0-20): explicit CAP theorem, consistency/latency tradeoffs discussed`;

export async function scoreSubmission(params: {
  question: Question;
  textAnswer: string;
  diagramText?: string;
  interviewTranscript?: string;
}): Promise<ScoreResult> {
  const { question, textAnswer, diagramText, interviewTranscript } = params;

  const parts = [
    `Question: ${question.title}`,
    `Description: ${question.description}`,
    `Model Answer (for reference): ${question.modelAnswer}`,
    '---',
    `Candidate's Answer:\n${textAnswer}`,
  ];

  if (diagramText) parts.push(`\nCandidate's Architecture Diagram:\n${diagramText}`);
  if (interviewTranscript) parts.push(`\nInterview Transcript:\n${interviewTranscript}`);

  const raw = await claudeChat({
    system: SCORING_SYSTEM,
    userMessage: parts.join('\n'),
    maxTokens: 1024,
  });

  let parsed: { breakdown: ScoreResult['breakdown']; strengths: string; gaps: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse score from Claude response');
  }

  const { breakdown, strengths, gaps } = parsed;
  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return { score, breakdown, strengths, gaps };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/sessions/scoringService.ts apps/system-design-qa/backend/src/sessions/scoringService.test.ts
git commit -m "feat(system-design-qa): add 5-dimension Claude scoring service"
```

---

### Task 10: Session controller

**Files:**
- Create: `apps/system-design-qa/backend/src/sessions/sessionController.ts`
- Create: `apps/system-design-qa/backend/src/sessions/sessionController.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/sessions/sessionController.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../db', () => ({
  prisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    question: { findUnique: vi.fn() },
  },
}));

vi.mock('./interviewService', () => ({
  getOpeningQuestion: vi.fn().mockResolvedValue('What is the scale?'),
  continueInterview: vi.fn().mockResolvedValue({ content: 'Next question?', readyToSubmit: false }),
}));

vi.mock('./scoringService', () => ({
  scoreSubmission: vi.fn().mockResolvedValue({
    score: 75,
    breakdown: { scalability: 15, data_model: 15, component_design: 15, reliability: 15, tradeoffs: 15 },
    strengths: 'Good work',
    gaps: 'Missing reliability',
  }),
}));

vi.mock('./diagramFetcher', () => ({
  fetchDiagram: vi.fn().mockResolvedValue(null),
  diagramToText: vi.fn().mockReturnValue(''),
}));

import { createSession, sendMessage, submitSession, getResult } from './sessionController';
import { prisma } from '../db';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const mockQuestion = { id: 'q1', title: 'Design Twitter', description: 'desc', hints: '[]', modelAnswer: 'answer' };

describe('createSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates structured session without calling interview service', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: 's1', messages: '[]' } as any);
    const req = { body: { questionId: 'q1', mode: 'structured' } } as unknown as Request;
    await createSession(req, mockRes());
    const { getOpeningQuestion } = await import('./interviewService');
    expect(getOpeningQuestion).not.toHaveBeenCalled();
  });

  it('creates interview session and stores opening question', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: 's1', messages: '[]' } as any);
    vi.mocked(prisma.session.update).mockResolvedValue({ id: 's1', messages: '[{"role":"assistant","content":"What is the scale?"}]' } as any);
    const req = { body: { questionId: 'q1', mode: 'interview' } } as unknown as Request;
    const res = mockRes();
    await createSession(req, res);
    const { getOpeningQuestion } = await import('./interviewService');
    expect(getOpeningQuestion).toHaveBeenCalled();
  });

  it('returns 404 when question not found', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(null);
    const req = { body: { questionId: 'missing', mode: 'structured' } } as unknown as Request;
    const res = mockRes();
    await createSession(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('submitSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when session not found', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    const req = { params: { id: 'missing' }, body: { textAnswer: 'my answer' } } as unknown as Request;
    const res = mockRes();
    await submitSession(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when session already submitted', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 's1', status: 'scored', question: mockQuestion } as any);
    const req = { params: { id: 's1' }, body: { textAnswer: 'answer' } } as unknown as Request;
    const res = mockRes();
    await submitSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getResult', () => {
  it('returns 404 when session not scored yet', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 's1', status: 'in_progress' } as any);
    const req = { params: { id: 's1' } } as unknown as Request;
    const res = mockRes();
    await getResult(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement sessionController.ts**

```typescript
// src/sessions/sessionController.ts
import type { Request, Response } from 'express';
import { prisma } from '../db';
import { getOpeningQuestion, continueInterview, type InterviewMessage } from './interviewService';
import { scoreSubmission } from './scoringService';
import { fetchDiagram, diagramToText } from './diagramFetcher';

export async function createSession(req: Request, res: Response): Promise<void> {
  const { questionId, mode } = req.body as { questionId: string; mode: string };

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  const session = await prisma.session.create({
    data: { questionId, mode, status: 'in_progress', messages: '[]' },
  });

  if (mode === 'interview') {
    const openingQuestion = await getOpeningQuestion(question);
    const messages: InterviewMessage[] = [{ role: 'assistant', content: openingQuestion }];
    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { messages: JSON.stringify(messages) },
    });
    res.json({ id: updated.id, messages });
    return;
  }

  res.json({ id: session.id, messages: [] });
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { question: true },
  });

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status !== 'in_progress') { res.status(400).json({ error: 'Session is not in progress' }); return; }
  if (session.mode !== 'interview') { res.status(400).json({ error: 'Only interview sessions accept messages' }); return; }

  const { content } = req.body as { content: string };
  const messages: InterviewMessage[] = JSON.parse(session.messages || '[]');
  messages.push({ role: 'user', content });

  const { content: reply, readyToSubmit } = await continueInterview(session.question, messages);
  messages.push({ role: 'assistant', content: reply });

  await prisma.session.update({
    where: { id: session.id },
    data: { messages: JSON.stringify(messages) },
  });

  res.json({ content: reply, readyToSubmit, messages });
}

export async function submitSession(req: Request, res: Response): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { question: true },
  });

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status !== 'in_progress') { res.status(400).json({ error: 'Session already submitted' }); return; }

  const { textAnswer, canvasDiagramId } = req.body as { textAnswer: string; canvasDiagramId?: string };

  let diagramText: string | undefined;
  if (canvasDiagramId) {
    const diagram = await fetchDiagram(canvasDiagramId);
    if (diagram) diagramText = diagramToText(diagram);
  }

  const messages: InterviewMessage[] = JSON.parse(session.messages || '[]');
  const interviewTranscript = session.mode === 'interview'
    ? messages.map(m => `${m.role}: ${m.content}`).join('\n')
    : undefined;

  await prisma.session.update({
    where: { id: session.id },
    data: { status: 'submitted', textAnswer, canvasDiagramId },
  });

  try {
    const result = await scoreSubmission({
      question: session.question,
      textAnswer,
      diagramText,
      interviewTranscript,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'scored',
        score: result.score,
        feedback: JSON.stringify({
          breakdown: result.breakdown,
          strengths: result.strengths,
          gaps: result.gaps,
        }),
      },
    });

    res.json({ ok: true, score: result.score });
  } catch (err) {
    console.error('[sessionController] scoring failed:', err);
    res.json({ ok: true, score: null, message: 'Scoring in progress, check result shortly' });
  }
}

export async function getResult(req: Request, res: Response): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { question: true },
  });

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status !== 'scored') { res.status(404).json({ error: 'Result not ready yet' }); return; }

  const feedback = JSON.parse(session.feedback || '{}');

  res.json({
    score: session.score,
    breakdown: feedback.breakdown,
    strengths: feedback.strengths,
    gaps: feedback.gaps,
    modelAnswer: session.question.modelAnswer,
    mode: session.mode,
  });
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/sessions/
git commit -m "feat(system-design-qa): add session controller (create, message, submit, result)"
```

---

### Task 11: Question generate controller + Express routes + index.ts

**Files:**
- Create: `apps/system-design-qa/backend/src/questions/generateController.ts`
- Create: `apps/system-design-qa/backend/src/api/routes.ts`
- Create: `apps/system-design-qa/backend/src/index.ts`

- [ ] **Step 1: Create generateController.ts**

```typescript
// src/questions/generateController.ts
import type { Request, Response } from 'express';
import { generateQuestion } from './questionGenerator';

export async function postGenerateQuestion(req: Request, res: Response): Promise<void> {
  const { company, genre, difficulty } = req.body as {
    company?: string;
    genre: string;
    difficulty: string;
  };

  if (!genre || !difficulty) {
    res.status(400).json({ error: 'genre and difficulty are required' });
    return;
  }

  try {
    const result = await generateQuestion({ company, genre, difficulty });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    res.status(500).json({ error: message });
  }
}
```

- [ ] **Step 2: Create src/api/routes.ts**

```typescript
// src/api/routes.ts
import { Router } from 'express';
import { getQuestions, getQuestion } from '../questions/questionController';
import { postGenerateQuestion } from '../questions/generateController';
import { createSession, sendMessage, submitSession, getResult } from '../sessions/sessionController';

const router = Router();

router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestion);
router.post('/questions/generate', postGenerateQuestion);

router.post('/sessions', createSession);
router.post('/sessions/:id/message', sendMessage);
router.post('/sessions/:id/submit', submitSession);
router.get('/sessions/:id/result', getResult);

export default router;
```

- [ ] **Step 3: Create src/index.ts**

```typescript
// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './api/routes';
import { seedQuestionsIfEmpty } from './questions/seeder';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3002', 10);

app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', router);

app.listen(PORT, async () => {
  console.log(`System Design Q&A API running on port ${PORT}`);
  await seedQuestionsIfEmpty();
});
```

- [ ] **Step 4: Verify lint passes**

```bash
npm run lint --workspace=apps/system-design-qa/backend
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/backend/src/questions/generateController.ts apps/system-design-qa/backend/src/api/ apps/system-design-qa/backend/src/index.ts
git commit -m "feat(system-design-qa): wire Express routes and entry point"
```

---

### Task 12: Canvas backend — public diagram export endpoint

**Files:**
- Modify: `apps/canvas/backend/src/canvas/routes.ts`
- Modify: `apps/canvas/backend/src/canvas/canvasController.ts`

- [ ] **Step 1: Add public export route to routes.ts**

Add after the existing `router.post('/diagrams/:id/export', ...)` line:

```typescript
// Public endpoint for server-to-server diagram export (no auth)
router.get('/diagrams/:id/export', (req, res) =>
  canvasController.getPublicExport(req as any, res)
);
```

Note: the existing `POST /diagrams/:id/export` is authenticated; this new `GET` is public (called by App C backend).

- [ ] **Step 2: Add getPublicExport to canvasController.ts**

Add this method to the `canvasController` object (after `exportDiagram`):

```typescript
async getPublicExport(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Look up diagram without userId check — public read for scoring purposes
    const prisma = getPrisma()!;
    const record = await prisma.diagram.findUnique({ where: { id: req.params.id } });
    if (!record) {
      res.status(404).json({ error: 'Diagram not found' });
      return;
    }
    const nodes = JSON.parse(record.nodes || '[]');
    const edges = JSON.parse(record.edges || '[]');
    res.json({ name: record.name, nodes, edges });
  } catch (error) {
    logger.fail('Failed to export diagram', { error });
    res.status(500).json({ error: 'Failed to export diagram' });
  }
},
```

- [ ] **Step 3: Verify Canvas backend lint**

```bash
npm run lint --workspace=apps/canvas/backend
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/canvas/backend/src/canvas/routes.ts apps/canvas/backend/src/canvas/canvasController.ts
git commit -m "feat(canvas): add public diagram export endpoint for App C scoring"
```

---

### Task 13: CI/CD pipeline updates

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `package.json` (root — add dev scripts)

- [ ] **Step 1: Add test + deploy jobs to deploy.yml**

In the `test` job, after the news-feed lines, add:

```yaml
      - name: System Design QA backend — typecheck
        run: npm run lint --workspace=apps/system-design-qa/backend
      - name: System Design QA backend — tests
        run: npm test --workspace=apps/system-design-qa/backend
```

Add a new deploy job after `deploy-news-feed-backend`:

```yaml
  deploy-system-design-qa-backend:
    name: Deploy System Design QA Backend (Railway)
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy
        run: railway up --service=system-design-qa-backend --detach
        working-directory: apps/system-design-qa/backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

- [ ] **Step 2: Add root dev scripts to package.json**

```json
"dev:system-design-qa-backend": "npm run dev --workspace=apps/system-design-qa/backend",
"dev:system-design-qa-frontend": "npm run dev --workspace=apps/system-design-qa/frontend"
```

- [ ] **Step 3: Run all backend tests to confirm nothing broken**

```bash
npm test --workspace=apps/system-design-qa/backend
npm test --workspace=apps/news-feed/backend
npm run lint --workspace=apps/canvas/backend
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml package.json
git commit -m "feat(system-design-qa): add CI/CD jobs and root dev scripts"
```
