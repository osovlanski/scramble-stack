import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { startScheduler } from './scheduler';
import { feedRouter } from './api/routes';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', feedRouter);

app.listen(PORT, () => {
  console.log(`News feed API running on port ${PORT}`);
  startScheduler();
});
