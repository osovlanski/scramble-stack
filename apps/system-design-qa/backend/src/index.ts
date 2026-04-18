// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './api/routes';
import { seedQuestionsIfEmpty } from './questions/seeder';
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

const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests.' },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', async (_req, res) => {
  try {
    const [totalQuestions, totalSessions, completedSessions, scoredSessions] = await Promise.all([
      prisma.question.count(),
      prisma.session.count(),
      prisma.session.count({ where: { status: 'completed' } }),
      prisma.session.findMany({
        where: { score: { not: null } },
        select: { score: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    const scores = scoredSessions.map(s => s.score).filter((s): s is number => typeof s === 'number');
    const recentAvgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null;
    return res.json({
      totalQuestions,
      totalSessions,
      completedSessions,
      recentAvgScore,
    });
  } catch (error) {
    console.error('Failed to read QA stats', error);
    return res.status(500).json({
      totalQuestions: 0,
      totalSessions: 0,
      completedSessions: 0,
      recentAvgScore: null,
    });
  }
});

app.use('/api', globalLimiter);
app.use('/api', router);

app.listen(env.PORT, async () => {
  console.log(`System Design Q&A API running on port ${env.PORT}`);
  await seedQuestionsIfEmpty();
});
