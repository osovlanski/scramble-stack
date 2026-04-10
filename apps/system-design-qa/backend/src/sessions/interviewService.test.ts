// src/sessions/interviewService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../claude', () => ({
  claudeConverse: vi.fn().mockResolvedValue('What is the expected read/write ratio?'),
}));

import { getOpeningQuestion, continueInterview, InterviewMessage } from './interviewService';
import { claudeConverse } from '../claude';

const mockQuestion = {
  title: 'Design Twitter',
  description: 'Design Twitter feed for 300M users.',
  hints: '["Consider fanout"]',
};

describe('getOpeningQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls claudeConverse with empty history and returns response', async () => {
    const result = await getOpeningQuestion(mockQuestion as any);
    expect(claudeConverse).toHaveBeenCalledOnce();
    expect(result).toBe('What is the expected read/write ratio?');
  });
});

describe('continueInterview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns readyToSubmit=false for fewer than 3 user turns', async () => {
    const messages: InterviewMessage[] = [
      { role: 'assistant', content: 'What is the scale?' },
      { role: 'user', content: '300M users' },
    ];
    const result = await continueInterview(mockQuestion as any, messages);
    expect(result.readyToSubmit).toBe(false);
  });

  it('returns readyToSubmit=true after 3 user turns', async () => {
    vi.mocked(claudeConverse).mockResolvedValueOnce('Great, go ahead and design the system.');
    const messages: InterviewMessage[] = [
      { role: 'assistant', content: 'Q1?' },
      { role: 'user', content: 'A1' },
      { role: 'assistant', content: 'Q2?' },
      { role: 'user', content: 'A2' },
      { role: 'assistant', content: 'Q3?' },
      { role: 'user', content: 'A3' },
    ];
    const result = await continueInterview(mockQuestion as any, messages);
    expect(result.readyToSubmit).toBe(true);
  });
});
