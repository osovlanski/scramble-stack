import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue(JSON.stringify({
    title: 'Design Uber dispatch',
    description: 'Design a dispatch system...',
    hints: ['Consider geohash', 'Think about matching latency'],
    modelAnswer: 'Use geospatial index...',
  })),
}));

vi.mock('../db', () => ({
  prisma: { question: { create: vi.fn().mockResolvedValue({ id: 'gen1' }) } },
}));

import { generateQuestion } from './questionGenerator';
import { claudeChat } from '../claude';
import { prisma } from '../db';

describe('generateQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls Claude and saves the generated question', async () => {
    const result = await generateQuestion({ genre: 'distributed-systems', difficulty: 'hard' });
    expect(claudeChat).toHaveBeenCalledOnce();
    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isAiGenerated: true, genre: 'distributed-systems' }),
      })
    );
    expect(result.id).toBe('gen1');
  });

  it('returns 400 if Claude response is not valid JSON', async () => {
    vi.mocked(claudeChat).mockResolvedValueOnce('not json');
    await expect(generateQuestion({ genre: 'feed', difficulty: 'medium' })).rejects.toThrow();
  });
});
