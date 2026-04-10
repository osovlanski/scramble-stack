// src/sessions/scoringService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue(JSON.stringify({
    breakdown: { scalability: 16, data_model: 14, component_design: 15, reliability: 13, tradeoffs: 14 },
    strengths: 'Good scalability approach',
    gaps: 'Missing fault tolerance details',
  })),
}));

import { scoreSubmission, ScoreResult } from './scoringService';
import { claudeChat } from '../claude';

const mockQuestion = {
  title: 'Design Twitter',
  description: 'Design Twitter feed',
  modelAnswer: 'Use fanout on write...',
};

describe('scoreSubmission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns total score as sum of breakdown', async () => {
    const result = await scoreSubmission({
      question: mockQuestion as any,
      textAnswer: 'My answer...',
    });
    expect(result.score).toBe(72);
    expect(result.breakdown.scalability).toBe(16);
    expect(result.strengths).toBe('Good scalability approach');
  });

  it('includes diagram text in prompt when provided', async () => {
    await scoreSubmission({
      question: mockQuestion as any,
      textAnswer: 'My answer',
      diagramText: 'Components: Tweet Service → DB',
    });
    const call = vi.mocked(claudeChat).mock.calls[0][0];
    expect(call.userMessage).toContain('Components: Tweet Service → DB');
  });

  it('throws when Claude response is invalid JSON', async () => {
    vi.mocked(claudeChat).mockResolvedValueOnce('not json');
    await expect(
      scoreSubmission({ question: mockQuestion as any, textAnswer: 'answer' })
    ).rejects.toThrow('Failed to parse score');
  });
});
