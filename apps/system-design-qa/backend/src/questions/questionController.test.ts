import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../db', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { getQuestions, getQuestion } from './questionController';
import { prisma } from '../db';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const mockQuestion = {
  id: 'q1',
  title: 'Design Twitter',
  company: 'Twitter',
  genre: 'feed',
  difficulty: 'hard',
  description: 'Design Twitter feed',
  hints: '["hint1"]',
  modelAnswer: 'model answer',
  isAiGenerated: false,
  createdAt: new Date(),
};

describe('getQuestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns questions with parsed hints', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([mockQuestion] as any);
    vi.mocked(prisma.question.count).mockResolvedValue(1);
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    await getQuestions(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ questions: expect.any(Array), total: 1 })
    );
    const { questions } = (res.json as any).mock.calls[0][0];
    expect(questions[0].hints).toEqual(['hint1']);
  });

  it('filters by company', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    vi.mocked(prisma.question.count).mockResolvedValue(0);
    const req = { query: { company: 'Uber' } } as unknown as Request;
    await getQuestions(req, mockRes());
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ company: 'Uber' }) })
    );
  });

  it('does not expose modelAnswer in list', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValue([mockQuestion] as any);
    vi.mocked(prisma.question.count).mockResolvedValue(1);
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    await getQuestions(req, res);
    const { questions } = (res.json as any).mock.calls[0][0];
    expect(questions[0].modelAnswer).toBeUndefined();
  });
});

describe('getQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when not found', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(null);
    const req = { params: { id: 'missing' } } as unknown as Request;
    const res = mockRes();
    await getQuestion(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns question without modelAnswer', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
    const req = { params: { id: 'q1' } } as unknown as Request;
    const res = mockRes();
    await getQuestion(req, res);
    const result = (res.json as any).mock.calls[0][0];
    expect(result.modelAnswer).toBeUndefined();
    expect(result.hints).toEqual(['hint1']);
  });
});
