// src/questions/generateController.ts
import type { Request, Response } from 'express';
import { generateQuestion } from './questionGenerator';

export async function postGenerateQuestion(req: Request, res: Response): Promise<void> {
  const { company, genre, difficulty } = req.body as {
    company?: string;
    genre: string;
    difficulty: string;
  };

  if (!genre || !difficulty) {
    res.status(400).json({ error: 'genre and difficulty are required' });
    return;
  }

  try {
    const result = await generateQuestion({ company, genre, difficulty });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    res.status(500).json({ error: message });
  }
}
