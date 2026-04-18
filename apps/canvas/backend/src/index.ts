import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import canvasRoutes from './canvas/routes';
import { getPrisma } from './core/databaseService';
import { cacheService } from './core/cacheService';
import { configService } from './core/configService';
import { loadEnv } from './core/env';
import { globalLimiter } from './core/rateLimiters';
import logger from './core/logger';

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
app.use(bodyParser.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', async (_req, res) => {
  try {
    const prisma = getPrisma();
    if (!prisma) return res.json({ diagrams: 0, lastUpdated: null });
    const [diagramCount, latest] = await Promise.all([
      prisma.diagram.count(),
      prisma.diagram.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    ]);
    return res.json({
      diagrams: diagramCount,
      lastUpdated: latest?.updatedAt.toISOString() ?? null,
    });
  } catch (error) {
    logger.fail('Failed to read canvas stats', { error });
    return res.status(500).json({ diagrams: 0, lastUpdated: null });
  }
});

app.use('/api', globalLimiter);
app.use('/api/canvas', canvasRoutes);

async function start(): Promise<void> {
  await configService.init();
  await cacheService.init();

  app.listen(env.PORT, () => {
    logger.start(`ScrambleStack backend running on port ${env.PORT}`);
  });
}

start().catch(error => {
  logger.fail('Failed to start server', { error });
  process.exit(1);
});
