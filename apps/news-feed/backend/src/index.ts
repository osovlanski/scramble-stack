import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { startScheduler } from './scheduler';
import { feedRouter } from './api/routes';
import { loadEnv } from './env';
import { prisma } from './db';

const env = loadEnv();

const app = express();

app.use(helmet());

const allowedOrigins = new Set<string>(
  [env.FRONTEND_URL, ...(env.ALLOWED_ORIGINS ?? '').split(',')]
    .map(origin => origin.trim())
    .filter(Boolean),
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());

const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests.' },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', async (_req, res) => {
  try {
    const [totalArticles, curatedArticles, latest] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { curatedAt: { not: null } } }),
      prisma.article.findFirst({
        where: { curatedAt: { not: null } },
        orderBy: { curatedAt: 'desc' },
        select: { curatedAt: true },
      }),
    ]);
    return res.json({
      totalArticles,
      curatedArticles,
      lastCuratedAt: latest?.curatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Failed to read news-feed stats', error);
    return res.status(500).json({ totalArticles: 0, curatedArticles: 0, lastCuratedAt: null });
  }
});

app.use('/api', globalLimiter as unknown as RequestHandler);
app.use('/api', feedRouter);

app.listen(env.PORT, () => {
  console.log(`News feed API running on port ${env.PORT}`);
  startScheduler();
});
