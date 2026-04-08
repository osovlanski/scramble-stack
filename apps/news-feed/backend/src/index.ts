import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`News feed API running on port ${PORT}`);
});
