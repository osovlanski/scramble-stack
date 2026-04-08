import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RawArticle } from './types';

vi.mock('../db', () => ({
  prisma: {
    article: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('./fetcherRegistry', () => ({
  fetchFromSource: vi.fn().mockResolvedValue([
    {
      externalId: 'test::https://example.com/1',
      title: 'Test',
      url: 'https://example.com/1',
      sourceId: 'test',
      publishedAt: new Date('2026-04-08'),
      rawContent: 'Content',
    } satisfies RawArticle,
  ]),
}));

import { runIngestion } from './ingestor';
import { prisma } from '../db';

describe('runIngestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches from each source and upserts articles', async () => {
    const sources = [
      { id: 's1', type: 'rss' as const, label: 'S1', url: 'https://example.com/feed' },
      { id: 's2', type: 'rss' as const, label: 'S2', url: 'https://example2.com/feed' },
    ];
    const result = await runIngestion(sources);
    expect(result.fetched).toBe(2);
    expect(prisma.article.upsert).toHaveBeenCalledTimes(2);
  });

  it('returns 0 fetched when no sources', async () => {
    const result = await runIngestion([]);
    expect(result.fetched).toBe(0);
  });
});
