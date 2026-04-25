import { Router } from 'express';
import { getFeed, getTodayDigest, triggerRefresh } from './feedController';
import { postInteraction } from './interactionController';
import { prisma } from '../db';

export const feedRouter = Router();

feedRouter.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

feedRouter.get('/feed', getFeed);
feedRouter.get('/digest', getTodayDigest);
feedRouter.post('/sources/refresh', triggerRefresh);
feedRouter.post('/articles/:id/interact', postInteraction);
