import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../db', () => ({
  prisma: {
    article: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(42),
    },
    digest: { findUnique: vi.fn() },
  },
}));

vi.mock('../digest/digestService', () => ({
  generateDigest: vi.fn().mockResolvedValue({ articleCount: 10, briefing: 'Today...' }),
  getDigest: vi.fn(),
}));

vi.mock('../sources/ingestor', () => ({ runIngestion: vi.fn().mockResolvedValue({ fetched: 5 }) }));
vi.mock('../curator/curatorService', () => ({ runCuration: vi.fn().mockResolvedValue({ curated: 3 }) }));

import { getFeed, getTodayDigest, triggerRefresh } from './feedController';
import { prisma } from '../db';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

describe('getFeed', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated articles', async () => {
    const articles = [{ id: 'a1', title: 'Test', themes: '["infra"]', signal: 'real', action: 'adopt', sourceId: 'geektime', personalScore: 1.2, publishedAt: new Date(), summary: 'S', insight: 'I', curatedAt: new Date() }];
    vi.mocked(prisma.article.findMany).mockResolvedValue(articles as any);

    const req = { query: { page: '1', theme: '' } } as unknown as Request;
    const res = mockRes();
    await getFeed(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ articles: expect.any(Array), total: 42 })
    );
  });
});

describe('triggerRefresh', () => {
  it('returns fetched and curated counts', async () => {
    const req = {} as Request;
    const res = mockRes();
    await triggerRefresh(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true, fetched: 5, curated: 3 });
  });
});
