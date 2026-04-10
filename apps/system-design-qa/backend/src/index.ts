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
