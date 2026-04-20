import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../core/databaseService';
import { loadEnv } from '../core/env';
import logger from '../core/logger';

const DEV_USER_EMAIL = 'dev@localhost';
const DEV_USER_NAME = 'Dev User';
const DEV_TOKEN_TTL = '30d';

/**
 * Dev-only auth shortcut: upserts a well-known "dev" user by email, mints a
 * short-lived JWT, and returns it. Frontend calls this on first load when
 * `import.meta.env.DEV` is true and there's no `auth_token` in localStorage —
 * replacing the "paste a token from dev-seed.ts into devtools" ritual.
 *
 * Intentionally NOT registered when NODE_ENV === 'production' so this route
 * cannot accidentally ship anywhere real.
 */
function registerDevAuthRoutes(router: Router): void {
  router.post('/dev-login', async (_req: Request, res: Response) => {
    const prisma = getPrisma();
    if (!prisma) {
      res.status(503).json({ success: false, message: 'Database not configured' });
      return;
    }

    try {
      const user = await prisma.user.upsert({
        where: { email: DEV_USER_EMAIL },
        create: { email: DEV_USER_EMAIL, name: DEV_USER_NAME },
        update: {},
      });

      const env = loadEnv();
      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: DEV_TOKEN_TTL });

      res.json({
        success: true,
        data: {
          token,
          userId: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      logger.fail('dev-login failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ success: false, message: 'Dev login failed' });
    }
  });
}

export function buildDevAuthRouter(): Router | null {
  if (process.env.NODE_ENV === 'production') return null;
  const router = Router();
  registerDevAuthRoutes(router);
  return router;
}
