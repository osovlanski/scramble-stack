import type { Request, Response } from 'express';
import { prisma } from '../db';

function parseQuestion(q: any) {
  const { modelAnswer: _omit, ...rest } = q;
  return { ...rest, hints: JSON.parse(q.hints || '[]') };
}

export async function getQuestions(req: Request, res: Response): Promise<void> {
  const { company, genre, difficulty, q } = req.query as Record<string, string | undefined>;

  const where: any = {};
  if (company) where.company = company;
  if (genre) where.genre = genre;
  if (difficulty) where.difficulty = difficulty;
  if (q) where.title = { contains: q };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.question.count({ where }),
  ]);

  res.json({ questions: questions.map(parseQuestion), total });
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  const question = await prisma.question.findUnique({ where: { id: String(req.params.id) } });
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  res.json(parseQuestion(question));
}
