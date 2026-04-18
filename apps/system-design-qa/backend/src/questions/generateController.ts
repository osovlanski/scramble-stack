// src/questions/generateController.ts
import type { Request, Response } from 'express';
import { generateQuestion } from './questionGenerator';

export async function postGenerateQuestion(req: Request, res: Response): Promise<void> {
  const { company, genre, difficulty, topic } = req.body as {
    company?: string;
    genre: string;
    difficulty: string;
    topic?: string;
  };

  if (!genre || !difficulty) {
    res.status(400).json({ error: 'genre and difficulty are required' });
    return;
  }

  const trimmedTopic = typeof topic === 'string' ? topic.slice(0, 200).trim() : undefined;

  try {
    const result = await generateQuestion({
      company,
      genre,
      difficulty,
      topic: trimmedTopic || undefined,
    });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    res.status(500).json({ error: message });
  }
}
