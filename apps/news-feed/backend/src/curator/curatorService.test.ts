import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  prisma: {
    article: {
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    userPreferenceProfile: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue(JSON.stringify([
    {
      id: 'article-1',
      summary: 'Good article about Kubernetes.',
      themes: ['infra'],
      signal: 'real',
      action: 'adopt',
      insight: 'Worth adopting at scale.',
    },
  ])),
}));

import { runCuration } from './curatorService';
import { prisma } from '../db';

describe('runCuration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('skips when no uncurated articles', async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([]);
    const result = await runCuration();
    expect(result.curated).toBe(0);
  });

  it('enriches uncurated articles via Claude and updates DB', async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      { id: 'article-1', title: 'K8s migration', url: 'https://example.com', rawContent: 'content' } as any,
    ]);

    const result = await runCuration();
    expect(result.curated).toBe(1);
    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-1' },
        data: expect.objectContaining({
          summary: 'Good article about Kubernetes.',
          signal: 'real',
          action: 'adopt',
        }),
      })
    );
  });
});
