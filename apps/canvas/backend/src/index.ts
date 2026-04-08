import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import canvasRoutes from './canvas/routes';
import { databaseService } from './core/databaseService';
import { cacheService } from './core/cacheService';
import { configService } from './core/configService';
import logger from './core/logger';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(bodyParser.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/canvas', canvasRoutes);

async function start(): Promise<void> {
  await configService.init();
  await cacheService.init();

  const requiredEnv = ['ANTHROPIC_API_KEY', 'JWT_SECRET', 'DATABASE_URL'];
  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    logger.fail('Missing required environment variables', { missing: missingEnv });
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.start(`ScrambleStack backend running on port ${PORT}`);
  });
}

start().catch(error => {
  logger.fail('Failed to start server', { error });
  process.exit(1);
});
