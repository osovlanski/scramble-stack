// src/sessions/sessionController.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../db', () => ({
  prisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    question: { findUnique: vi.fn() },
  },
}));

vi.mock('./interviewService', () => ({
  getOpeningQuestion: vi.fn().mockResolvedValue('What is the scale?'),
  continueInterview: vi.fn().mockResolvedValue({ content: 'Next question?', readyToSubmit: false }),
}));

vi.mock('./scoringService', () => ({
  scoreSubmission: vi.fn().mockResolvedValue({
    score: 75,
    breakdown: { scalability: 15, data_model: 15, component_design: 15, reliability: 15, tradeoffs: 15 },
    strengths: 'Good work',
    gaps: 'Missing reliability',
  }),
}));

vi.mock('./diagramFetcher', () => ({
  fetchDiagram: vi.fn().mockResolvedValue(null),
  diagramToText: vi.fn().mockReturnValue(''),
}));

import { createSession, sendMessage, submitSession, getResult } from './sessionController';
import { prisma } from '../db';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const mockQuestion = { id: 'q1', title: 'Design Twitter', description: 'desc', hints: '[]', modelAnswer: 'answer' };

describe('createSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates structured session without calling interview service', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: 's1', messages: '[]' } as any);
    const req = { body: { questionId: 'q1', mode: 'structured' } } as unknown as Request;
    await createSession(req, mockRes());
    const { getOpeningQuestion } = await import('./interviewService');
    expect(getOpeningQuestion).not.toHaveBeenCalled();
  });

  it('creates interview session and stores opening question', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion as any);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: 's1', messages: '[]' } as any);
    vi.mocked(prisma.session.update).mockResolvedValue({ id: 's1', messages: '[{"role":"assistant","content":"What is the scale?"}]' } as any);
    const req = { body: { questionId: 'q1', mode: 'interview' } } as unknown as Request;
    const res = mockRes();
    await createSession(req, res);
    const { getOpeningQuestion } = await import('./interviewService');
    expect(getOpeningQuestion).toHaveBeenCalled();
  });

  it('returns 404 when question not found', async () => {
    vi.mocked(prisma.question.findUnique).mockResolvedValue(null);
    const req = { body: { questionId: 'missing', mode: 'structured' } } as unknown as Request;
    const res = mockRes();
    await createSession(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('submitSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when session not found', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    const req = { params: { id: 'missing' }, body: { textAnswer: 'my answer' } } as unknown as Request;
    const res = mockRes();
    await submitSession(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when session already submitted', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 's1', status: 'scored', question: mockQuestion } as any);
    const req = { params: { id: 's1' }, body: { textAnswer: 'answer' } } as unknown as Request;
    const res = mockRes();
    await submitSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getResult', () => {
  it('returns 404 when session not scored yet', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 's1', status: 'in_progress' } as any);
    const req = { params: { id: 's1' } } as unknown as Request;
    const res = mockRes();
    await getResult(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
