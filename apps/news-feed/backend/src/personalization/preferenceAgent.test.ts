import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  prisma: {
    articleInteraction: {
      findMany: vi.fn(),
    },
    article: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    userPreferenceProfile: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue(JSON.stringify({
    themeWeights: { infra: 1.4, 'ai-ml': 1.2, security: 1.0, frontend: 0.8, data: 1.0, cloud: 1.0, culture: 0.7, tooling: 0.6 },
    signalWeights: { real: 1.5, hype: 0.8, noise: 0.2 },
    actionWeights: { adopt: 1.3, watch: 1.0, avoid: 0.7, null: 0.9 },
    sourceWeights: { geektime: 1.2 },
    summary: 'User prefers infra and ai-ml content.',
    updatedAt: '2026-04-08T07:00:00.000Z',
  })),
}));

import { runPreferenceAgent } from './preferenceAgent';
import { prisma } from '../db';

describe('runPreferenceAgent', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('skips when fewer than 10 interactions', async () => {
    vi.mocked(prisma.articleInteraction.findMany).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ id: `i${i}`, articleId: `a${i}`, type: 'view', value: null, recordedAt: new Date() }))
    );
    const result = await runPreferenceAgent();
    expect(result.updated).toBe(false);
  });

  it('calls Claude and saves profile when enough interactions', async () => {
    vi.mocked(prisma.articleInteraction.findMany).mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: `i${i}`, articleId: `a${i % 5}`, type: 'thumb_up', value: null, recordedAt: new Date(),
        article: { themes: '["infra"]', signal: 'real', action: 'adopt', sourceId: 'geektime' },
      })) as any
    );
    const result = await runPreferenceAgent();
    expect(result.updated).toBe(true);
    expect(prisma.userPreferenceProfile.upsert).toHaveBeenCalled();
    const { claudeChat } = await import('../claude');
    expect(claudeChat).toHaveBeenCalledOnce();
  });
});
