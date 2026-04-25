// src/api/routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getQuestions, getQuestion } from '../questions/questionController';
import { postGenerateQuestion } from '../questions/generateController';
import { createSession, sendMessage, submitSession, getResult } from '../sessions/sessionController';
import { loadEnv } from '../env';
import { prisma } from '../db';

const env = loadEnv();

const aiLimiter = rateLimit({
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI endpoint rate limit exceeded.' },
});

const router = Router();

router.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestion);
router.post('/questions/generate', aiLimiter, postGenerateQuestion);

router.post('/sessions', createSession);
router.post('/sessions/:id/message', aiLimiter, sendMessage);
router.post('/sessions/:id/submit', aiLimiter, submitSession);
router.get('/sessions/:id/result', getResult);

export default router;
